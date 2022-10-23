
/**
 * Generated using theia-plugin-generator
 *

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

}*/
