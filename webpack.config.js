const path = require('path');
const webpack = require('webpack');
const dotenv = require('dotenv');

const env = dotenv.config().parsed || {};
const envKeys = Object.keys(env).reduce((prev, next) => {
    prev[`process.env.${next}`] = JSON.stringify(env[next]);
    return prev;
}, {});

module.exports = {
    mode: 'development',
    entry: {
        main: './src/index.ts',      // AR 页面
        quiz: './src/quiz.ts',       // Quiz 逻辑
        result: './src/result.ts'    // 结果页面逻辑
    },
    output: {
        filename: '[name].bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: { '@modules': path.resolve(__dirname, 'src/modules') },
        fallback: { process: require.resolve('process/browser') }
    },
    module: {
        rules: [
            { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
            { test: /\.css$/i, use: ['style-loader','css-loader'] },
            { test: /\.(png|jpe?g|gif)$/i, type: 'asset/resource' }
        ]
    },
    plugins: [
        new webpack.DefinePlugin(envKeys),
        new webpack.ProvidePlugin({ process: 'process/browser' })
    ],
    devServer: {
        static: path.join(__dirname, 'public'),
        historyApiFallback: true,
        port: 8080,
        open: true
    }
};