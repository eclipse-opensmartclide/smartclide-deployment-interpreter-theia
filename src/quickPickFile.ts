import * as path from "path";
import * as vscode from 'vscode';
import { Disposable, QuickPick, window } from "vscode";
import { FILE_SEARCH_MAX_RESULT, YAML_GLOB_PATTERN, JENKINSFILE_GLOB_PATTERN, GITLABCI_GLOB_PATTERN, EXCLUDE_GLOB_PATTERN, EXCLUDE_GLOB_PATTERN2, JS_GLOB_PATTERN } from "./constants";
import { OperationCanceledError } from "./Errors";

export interface Item extends vscode.QuickPickItem {
    relativeFilePath: string;
    relativeFolderPath: string;
    absoluteFilePath: string;
    absoluteFolderPath: string;
    uri: vscode.Uri;
}

export async function quickPickPipelineFileItem(fileUri: vscode.Uri, rootFolder: vscode.WorkspaceFolder, toJenkins: boolean): Promise<Item> {
    if (fileUri) {
        return createFileItem(rootFolder, fileUri);
    }

    let filePatterns = toJenkins? [GITLABCI_GLOB_PATTERN] : [JENKINSFILE_GLOB_PATTERN];
    const items: Item[] = await resolveFilesOfPattern(rootFolder, filePatterns, EXCLUDE_GLOB_PATTERN);
    const fileItem: Item = await quickPickFileItem({
        title: "Pipeline descriptor file",
        placeholder: "Select a pipeline descriptor file:",
        items: items
    });

    if (!fileItem) {
        throw new OperationCanceledError('No item was selected');
    }
    return fileItem;
}

export function createFileItem(rootFolder: vscode.WorkspaceFolder, uri: vscode.Uri): Item {
    const relativeFilePath = path.join(".", uri.fsPath.substr(rootFolder.uri.fsPath.length));

    return <Item>{
        description: undefined,
        relativeFilePath: relativeFilePath,
        label: relativeFilePath,
        relativeFolderPath: path.dirname(relativeFilePath),
        absoluteFilePath: uri.fsPath,
        absoluteFolderPath: rootFolder.uri.fsPath,
        uri: uri
    };
}

export async function resolveFilesOfPattern(rootFolder: vscode.WorkspaceFolder, filePatterns: string[], excludePattern?: string)
    : Promise<Item[] | undefined> {
    let uris: vscode.Uri[] = [];
    await Promise.all(filePatterns.map(async (pattern: string) => {
        uris.push(...await getFileUris(rootFolder, pattern, excludePattern));
    }));
    // remove possible duplicates
    uris = uris.filter((uri, index) => uris.findIndex(uri2 => uri.toString() === uri2.toString()) === index);

    if (!uris || uris.length === 0) {
        throw new OperationCanceledError("No suitable pipeline files found in workspace");
    } else {
        return uris.map(uri => createFileItem(rootFolder, uri));
    }
}

async function getFileUris(folder: vscode.WorkspaceFolder, globPattern: string, excludePattern?: string): Promise<vscode.Uri[]> {
    return await vscode.workspace.findFiles(new vscode.RelativePattern(folder, globPattern), excludePattern ? new vscode.RelativePattern(folder, excludePattern) : undefined, FILE_SEARCH_MAX_RESULT, undefined);
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
