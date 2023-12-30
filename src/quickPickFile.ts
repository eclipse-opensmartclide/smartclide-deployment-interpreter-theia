/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
import * as path from "path";
import * as theia from "@theia/plugin";
import { Disposable, QuickPick, window } from "@theia/plugin";
import { FILE_SEARCH_MAX_RESULT, YAML_GLOB_PATTERN, JENKINSFILE_GLOB_PATTERN, GITLABCI_GLOB_PATTERN, EXCLUDE_GLOB_PATTERN, EXCLUDE_GLOB_PATTERN2, JS_GLOB_PATTERN } from "./constants";
import { OperationCanceledError } from "./Errors";

export interface Item extends theia.QuickPickItem {
    relativeFilePath: string;
    relativeFolderPath: string;
    absoluteFilePath: string;
    absoluteFolderPath: string;
}

export async function quickPickJenkinsfileFileItem(fileUri: theia.Uri, rootFolder: theia.WorkspaceFolder): Promise<Item> {
    if (fileUri) {
        return createFileItem(rootFolder, fileUri);
    }

    const items: Item[] = await resolveFilesOfPattern(rootFolder, [JENKINSFILE_GLOB_PATTERN], EXCLUDE_GLOB_PATTERN);
    const fileItem: Item = await quickPickFileItem({
        title: "Jenkins pipeline descriptor file",
        placeholder: "Select a Jenkins pipeline descriptor file:",
        items: items
    });

    if (!fileItem) {
        throw new OperationCanceledError('No item was selected');
    }
    return fileItem;
}

export function createFileItem(rootFolder: theia.WorkspaceFolder, uri: theia.Uri): Item {
    const relativeFilePath = path.join(".", uri.fsPath.substr(rootFolder.uri.fsPath.length));

    return <Item>{
        description: undefined,
        relativeFilePath: relativeFilePath,
        label: relativeFilePath,
        relativeFolderPath: path.dirname(relativeFilePath),
        absoluteFilePath: uri.fsPath,
        absoluteFolderPath: rootFolder.uri.fsPath
    };
}

export async function resolveFilesOfPattern(rootFolder: theia.WorkspaceFolder, filePatterns: string[], excludePattern?: string)
    : Promise<Item[] | undefined> {
    let uris: theia.Uri[] = [];
    await Promise.all(filePatterns.map(async (pattern: string) => {
        uris.push(...await getFileUris(rootFolder, pattern, excludePattern));
    }));
    // remove possible duplicates
    uris = uris.filter((uri, index) => uris.findIndex(uri2 => uri.toString() === uri2.toString()) === index);

    if (!uris || uris.length === 0) {
        return undefined;
    } else {
        return uris.map(uri => createFileItem(rootFolder, uri));
    }
}

async function getFileUris(folder: theia.WorkspaceFolder, globPattern: string, excludePattern?: string): Promise<theia.Uri[]> {
    return await theia.workspace.findFiles(new theia.RelativePattern(folder, globPattern), excludePattern ? new theia.RelativePattern(folder, excludePattern) : undefined, FILE_SEARCH_MAX_RESULT, undefined);
}

export interface IPickMetadata {
    title: string;
    placeholder: string;
    items: Item[];
}

export async function quickPickFileItem(pickMetadata: IPickMetadata): Promise<Item> {
    const disposables: Disposable[] = [];
    const result: Item = await new Promise<Item>((resolve, reject) => {
        const pickBox: QuickPick<Item> = window.createQuickPick<Item>();
        pickBox.title = pickMetadata.title;
        pickBox.placeholder = pickMetadata.placeholder;
        pickBox.items = pickMetadata.items;
        pickBox.ignoreFocusOut = true;

        disposables.push(
            pickBox.onDidAccept(() => {
                if (!pickBox.selectedItems[0]) {
                    return;
                }
                return resolve(pickBox.selectedItems[0]);
            }),
            pickBox.onDidHide(() => {
                return reject(new OperationCanceledError("No file selected"));
            })
        );
        disposables.push(pickBox);
        pickBox.show();
    });
    for (const d of disposables) {
        d.dispose();
    }
    return result;
}
