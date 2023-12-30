/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import * as theia from "@theia/plugin";
import * as path from "path";
import { OperationCanceledError } from "./Errors";
import { quickPickJenkinsfileFileItem } from "./quickPickFile";
import { quickPickWorkspaceFolder } from './quickPickWorkspaceFolder';

export async function convertPipeline(gitlabFileUri: theia.Uri | undefined): Promise<void> {
    try {
        let rootFolder: theia.WorkspaceFolder;
        if (gitlabFileUri) {
            rootFolder = theia.workspace.getWorkspaceFolder(gitlabFileUri);
        }

        rootFolder = rootFolder || await quickPickWorkspaceFolder('Please first open a folder or workspace.');

        let fileItem = await quickPickJenkinsfileFileItem(gitlabFileUri, rootFolder);
        const fileUri = theia.Uri.file(fileItem.absoluteFilePath);

        let outputFile = await doConvertPipeline(fileUri);

        await theia.window.showTextDocument(outputFile);
        theia.window.showInformationMessage("File conversion completed!");
    } catch (error) {
        if (error instanceof OperationCanceledError) {
            theia.window.showErrorMessage(error.message);
        } else {
            theia.window.showErrorMessage(`Error: ${(error as Error).message}`);
        }
        throw error;
    }
}

async function doConvertPipeline(gitlabFileUri: theia.Uri): Promise<theia.Uri> {
    var pipelineConversionService = theia.workspace.getConfiguration("smartclide.pipeline-interpreter").get<string>("url");

    var parentDir = path.dirname(gitlabFileUri.fsPath);
    var outputFile = theia.Uri.file(path.resolve(parentDir, "converted.gitlab-ci.yml"));

    var myForm = new FormData();
    var fileContent = await theia.workspace.fs.readFile(gitlabFileUri);
    myForm.append("file", new Blob([fileContent]));

    await fetch(pipelineConversionService, {
        method: 'post',
        headers: {
            'Accept': '*/*',
        },
        body: myForm
    })
        .then(res => {
            if (!res.ok) {
                throw Error("HTTP request returned status " + res.status + " - " + res.statusText);
            }
            return res;
        })
        .then(res => {
            res.body.getReader().read().then(content => theia.workspace.fs.writeFile(outputFile, content.value));
        })

    return outputFile;
}
