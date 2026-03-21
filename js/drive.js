export class DriveManager {
    constructor(clientId) {
        // You'll need an active Client ID here
        this.clientId = clientId || '370099282335-e84qqo6m1pransumqtpuh344s0gcdp9t.apps.googleusercontent.com';
        this.tokenClient = null;
        this.accessToken = null;
        this.folderId = null;
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

    authorize(silent = false) {
        if (this.tokenClient) {
            this.tokenClient.requestAccessToken({ prompt: silent ? '' : 'consent' });
        }
    }

    async getOrCreateFolder(folderName = "Eyes-Closed Writer") {
        if (!this.accessToken) throw new Error("Not authenticated");

        // Search for the folder
        const response = await gapi.client.drive.files.list({
            q: `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            this.folderId = files[0].id;
            return this.folderId;
        }

        // Create the folder if it doesn't exist
        const folderMetadata = {
            'name': folderName,
            'mimeType': 'application/vnd.google-apps.folder'
        };
        const createRes = await gapi.client.drive.files.create({
            resource: folderMetadata,
            fields: 'id'
        });

        this.folderId = createRes.result.id;
        return this.folderId;
    }

    async ensureFileExists(fileName = 'Draft.txt') {
        if (!this.accessToken) throw new Error("Not authenticated");

        if (!this.folderId) {
            await this.getOrCreateFolder();
        }

        // Add today's date to the filename
        const today = new Date();
        const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        const fullFileName = `${dateStr} - ${fileName}`;

        // Search inside the specific folder
        const response = await gapi.client.drive.files.list({
            q: `name='${fullFileName}' and trashed=false and '${this.folderId}' in parents`,
            spaces: 'drive',
            fields: 'files(id, name)'
        });

        const files = response.result.files;
        if (files && files.length > 0) {
            this.fileId = files[0].id;
        } else {
            const fileMetadata = {
                'name': fullFileName,
                'mimeType': 'text/plain',
                'parents': [this.folderId]
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

            const request = gapi.client.request({
                'path': `/upload/drive/v3/files/${this.fileId}`,
                'method': 'PATCH',
                'params': { 'uploadType': 'media' },
                'headers': {
                    'Content-Type': 'text/plain'
                },
                'body': text || ' '
            });

            await request;
            return true;
        } catch (e) {
            console.error("Drive upload failed", e);
            return false;
        }
    }
}
