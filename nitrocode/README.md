NitroCode
 Code faster. Think local. Scale to cloud.

NitroCode is a production coding tool that uses artificial intelligence. It runs on your computer. It also works with cloud services like Anthropic, OpenAI and Gemini.

This guide will show you how to install and run NitroCode on a Windows computer.



Step-by-Step Installation for Windows PC
 1. Install Node.js
You need Node.js to run Vite and Express.
Go to the Node.js website and download the installer.
Run the installer and keep all the default settings.
When it is done open PowerShell or Command Prompt and type:

```powershell

node -v

npm -v

```

You should see version numbers. If you do not see them restart your computer.

2. Install Git

The Git plugin uses Git to work with code.

- Go to the Git website. Download the installer.

- Run the installer and keep all the default settings.

- When it is done open PowerShell and type:

```powershell

git --version

```

You should see the version number.
 3. Install Ollama

Ollama lets you use intelligence on your computer.

- Go to the Ollama website. Download the installer.

- Run the installer and make sure the Ollama icon is in the system tray.

- Open PowerShell. Download a model:

```powershell

ollama pull codellama

```

- Open a web browser and go to http://localhost:11434 to see if it is working.

---

## Setting Up the Project

Now that you have installed everything:

1. Open PowerShell in the project folder:

```powershell

cd "g:\AntiGravity Stuff\nitrocode"

```

2. Install the dependencies:

```powershell

npm install

```

3. Set up the environment:

```powershell

copy.env.example.env

```

You can add your cloud keys to the.env file. Do it later, in the app.

---

## Run the Application

Start the servers:

```powershell

npm run dev

```

This starts the backend and frontend servers.

Open a web browser. Go to:

 ""http://localhost:5173 ""
Connecting Your Configurations

1. Ollama Integration:

Open NitroCode and click the Settings icon.

Set the Ollama directory path.

Make sure the status dot is green.

2. Adding Cloud Keys:

Open Settings. Add your cloud keys.

3. Plugins:

You can add or remove plugins in the Settings.