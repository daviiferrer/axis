# Setup GitHub Actions & Secrets

To ensure the automatic deployment works, you need to configure "Secrets" in your GitHub repository. These secrets keep sensitive data (like your server password and API keys) out of the public code files.

## 1. Go to Your Repository Settings
1. Open your repository on GitHub: [daviiferrer/axis](https://github.com/daviiferrer/axis)
2. Click on **Settings** (top right tab).
3. In the left sidebar, click **Secrets and variables** > **Actions**.
4. Click the green button **New repository secret**.

## 2. Add the Following Secrets

You need to add each of these one by one.

| Name | Value to Enter |
|------|----------------|
| `VPS_HOST` | `31.97.166.108` |
| `VPS_USER` | `root` |
| `VPS_SSH_KEY` | *(Paste your private SSH key content here. It starts with `-----BEGIN OPENSSH PRIVATE KEY-----`)* |
| `ENV_PRODUCTION` | *(Copy the **ENTIRE** content of your local `.env.production` file and paste it here)* |

### How to get your SSH Key?
If you have the key file (e.g., `id_rsa`) on your computer, open it with a text editor and copy everything.

### How to get `ENV_PRODUCTION`?
Open the file `.env.production` in your VS Code (it's in the root of your project), select all text (Ctrl+A), copy (Ctrl+C), and paste it into the secret value.

## 3. Trigger a Deploy
Once these secrets are saved:
1. Go to the **Actions** tab in GitHub.
2. You might see a failed run. You can re-run it, or...
3. Just push a new commit to `main`, and it will auto-deploy!
