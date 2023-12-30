/*******************************************************************************
 * Copyright (C) 2021-2022 KAIROS DS
 * 
 * This program and the accompanying materials are made
 * available under the terms of the Eclipse Public License 2.0
 * which is available at https://www.eclipse.org/legal/epl-2.0/
 * 
 * SPDX-License-Identifier: EPL-2.0
 ******************************************************************************/
const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');

module.exports = {
    entry: './src/smartclide-pipeline-interpreter-plugin-frontend.ts',
    devtool: 'source-map',
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: [
                    {
                        loader: 'ts-loader',
                    }
                ],
                exclude: /node_modules/
            }
        ]
    },
    plugins: [
        new CleanWebpackPlugin(['dist'])
    ],
    resolve: {
        extensions: ['.ts', '.js']
    },
    output: {
        filename: 'smartclide-pipeline-interpreter-plugin-frontend.js',
        
        libraryTarget: "var",
        library: "theia_smartclide_pipeline_interpreter_plugin",
                
        path: path.resolve(__dirname, 'dist')
    },
    externals: {
        
            "@theia/plugin": "theia.theia_smartclide_pipeline_interpreter_plugin"
        
	}
};
