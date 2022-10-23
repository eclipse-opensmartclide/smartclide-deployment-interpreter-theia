import * as vscode from 'vscode';
import * as path from "path";
import { OperationCanceledError } from "./Errors";
import { quickPickPipelineFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from './quickPickWorkspaceFolder';
import * as FormData from "form-data";
import fetch from 'node-fetch';
import * as fs from 'fs';

export async function convertPipeline(pipelineFileUri: vscode.Uri | undefined, toJenkins: boolean): Promise<void> {
    try {
        var rootFolder;
        if (pipelineFileUri) {
            rootFolder = vscode.workspace.getWorkspaceFolder(pipelineFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('Please first open a folder or workspace.');

        let fileItem =  await quickPickPipelineFileItem(pipelineFileUri, rootFolder, toJenkins);
        // const fileUri = vscode.Uri.file(fileItem.absoluteFilePath);

        let outputFile = await doConvertPipeline(fileItem.uri, toJenkins);

        await vscode.window.showTextDocument(outputFile);
        vscode.window.showInformationMessage("File conversion completed!");
    } catch (error) {
        if (error instanceof OperationCanceledError) {
            vscode.window.showErrorMessage(error.message);
        } else {
            vscode.window.showErrorMessage(`Error: ${(error as Error).message}`);
        }
        throw error;
    }
}

async function doConvertPipeline(pipelineFileUri: vscode.Uri, toJenkins: boolean): Promise<vscode.Uri> {
    var pipelineConversionService = toJenkins? 
            vscode.workspace.getConfiguration("smartclide.pipeline-converter.tojenkins").get<string>("url","http://localhost:8080/api/v1/pipeline/jenkins")
            : vscode.workspace.getConfiguration("smartclide.pipeline-converter.togitlab").get<string>("url","http://localhost:8080/api/v1/pipeline/gitlab");

    var outputFileName = path.basename(pipelineFileUri.path);
    outputFileName += toJenkins? ".jenkinsfile" : ".gitlab-ci.yaml";

    var parentDir = path.dirname(pipelineFileUri.fsPath);
    var outputFile = vscode.Uri.file(path.resolve(parentDir, outputFileName));

    var myForm = new FormData();
    // var fileContent = await vscode.workspace.fs.readFile(pipelineFileUri);
    // myForm.append("file", new Blob([fileContent]));
    myForm.append("file", fs.createReadStream(pipelineFileUri.fsPath));

    await fetch(pipelineConversionService, {
        method: 'post',
        headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            'Accept': '*/*',
        },
        body: myForm
    })
        .then(res => {
            if (!res.ok) {
                throw Error("HTTP request returned status " + res.status + " - " + res.body.read());
            }
            return res;
        })
        .then(res => {
            // res.body.getReader().read().then(content => vscode.workspace.fs.writeFile(outputFile, content.value));
            // fs.mkdirSync(path.resolve(destinationFolderPath));
            fs.createWriteStream(outputFile.fsPath).write(res?.body?.read());
        });

    return outputFile;
}