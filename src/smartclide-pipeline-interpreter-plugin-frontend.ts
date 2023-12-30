/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
/**
 * Generated using theia-plugin-generator
 */

import * as theia from '@theia/plugin';
import { convertPipeline } from './pipelineHandler';

export function start(context: theia.PluginContext) {
    const convertPipelineCommand = {
        id: 'pipeline-convert-command',
        label: "SmartCLIDE: Convert Jenkins pipeline..."
    };
    console.log("Registering convertPipelineCommand!!!!!!!!!!!");
    context.subscriptions.push(theia.commands.registerCommand(convertPipelineCommand, (...args: any[]) => {
        convertPipeline(undefined);
    }));
}

export function stop() {

}
