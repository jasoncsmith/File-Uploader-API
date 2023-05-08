const webpack = require('webpack');
const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const PACKAGE = require('./package.json');

console.log(`node version: ${PACKAGE.engines.node}`);
console.log(`npm version: ${PACKAGE.engines.npm}`);

// core-js is cheaper than lodash.
// import 'core-js/stable/array/find';
// import 'lodash/find';

module.exports = {
    mode: 'production',
    devtool: 'source-map', // ' A full SourceMap is emitted as a separate file. It adds a reference comment to the bundle so development tools know where to find it.'

    entry: {
        app: './src/app.ts'
    },

    output: {
        publicPath: 'dist/', // wont serve from wwwroot
        path: path.resolve(__dirname, 'dist'),

        filename: '[name].bundle.js',
        chunkFilename: '[name].bundle.js?ver=[contenthash]',

        clean: true, // cleans dist dir on each build

        libraryTarget: 'var',
        library: 'appLaunch',
        libraryExport: 'default'
    },

    resolve: {
        modules: ['node_modules'],
        extensions: ['.ts', '.js', '.scss'] //, '.jsx'
    },

    optimization: {
        splitChunks: {
            cacheGroups: {
                default: false,
                commons: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendor',
                    chunks: 'all',
                    minChunks: 1
                }
            }
        }

    },

    module: {
        rules: [
            {
                test: /\.(jpe?g|png)$/i,
                type: 'asset',
            },
            
            {
                test: /\.scss|\.css$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader'
                ]
            },

            {
                test: /\.ts|\.js|\.mjs$/,
                exclude: /(node_modules|bower_components)/,
                loader: 'babel-loader'
            },

            {
                test: /\.(html)$/,
                loader: 'html-loader'
            }
        ]
    },

    plugins: [

        new MiniCssExtractPlugin({
            filename: '[name].bundle.css'
        }),

        new webpack.ProvidePlugin({
            ko: 'knockout'
        })

        // ,
        // new BundleAnalyzerPlugin()
    ]
};