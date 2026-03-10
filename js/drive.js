export class DriveManager {
    constructor(clientId) {
        // You'll need an active Client ID here
        this.clientId = clientId || 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
        this.tokenClient = null;
        this.accessToken = null;
        this.fileId = null;
        this.isReady = false;

        this.SCOPES = 'https://www.googleapis.com/auth/drive.file';
        this.DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
    }

    init(onAuthChange) {
        if (!window.google || !window.gapi) {
            console.error("Google APIs not loaded yet.");
            return;
        }

        gapi.load('client', async () => {
            await gapi.client.init({
                discoveryDocs: [this.DISCOVERY_DOC],
            });

            this.tokenClient = google.accounts.oauth2.initTokenClient({
                client_id: this.clientId,
                scope: this.SCOPES,
                callback: (tokenResponse) => {
                    if (tokenResponse.error !== undefined) {
                        throw (tokenResponse);
                    }
                    this.accessToken = tokenResponse.access_token;
                    this.isReady = true;
                    if (onAuthChange) onAuthChange(true);
                },
            });
        });
    }

    authorize() {
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken({ prompt: 'consent' });
        }
    }

    async ensureFileExists(fileName = 'EyesClosedDraft.txt') {
        if (!this.accessToken) throw new Error("Not authenticated");

        const response = await gapi.client.drive.files.list({
            q: `name='${fileName}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            this.fileId = files[0].id;
        } else {
            const fileMetadata = {
                'name': fileName,
                'mimeType': 'text/plain'
            };
            const createRes = await gapi.client.drive.files.create({
                resource: fileMetadata,
                fields: 'id'
            });
            this.fileId = createRes.result.id;
        }
    }

    async saveDraft(text) {
        if (!this.isReady || !this.accessToken) return false;

        try {
            if (!this.fileId) {
                await this.ensureFileExists();
            }

            const boundary = '-------314159265358979323846';
            const delimiter = "\\r\\n--" + boundary + "\\r\\n";
            const close_delim = "\\r\\n--" + boundary + "--";

            const metadata = {
                'mimeType': 'text/plain'
            };

            const multipartRequestBody =
                delimiter +
                'Content-Type: application/json\\r\\n\\r\\n' +
                JSON.stringify(metadata) +
                delimiter +
                'Content-Type: text/plain\\r\\n\\r\\n' +
                text +
                close_delim;

            const request = gapi.client.request({
                'path': `/upload/drive/v3/files/${this.fileId}`,
                'method': 'PATCH',
                'params': { 'uploadType': 'multipart' },
                'headers': {
                    'Content-Type': 'multipart/related; boundary="' + boundary + '"'
                },
                'body': multipartRequestBody
            });

            await request;
            return true;
        } catch (e) {
            console.error("Drive upload failed", e);
            return false;
        }
    }
}
