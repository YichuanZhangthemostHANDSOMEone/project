const path    = require('path');
const webpack = require('webpack');
const Dotenv  = require('dotenv-webpack');

module.exports = {
    mode: 'development',

    entry: {
        main:   './src/index.ts',
        topics: './src/topics.ts',
        quiz:   './src/quiz.ts',
        result: './src/result.ts'
    },

    output: {
        filename:   '[name].bundle.js',
        path:       path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },

    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@modules': path.resolve(__dirname, 'src/modules')
        },
        fallback: {
            process: require.resolve('process/browser'),
            fs:      false,                              // 不提供 fs
            path:    require.resolve('path-browserify'), // 用 path-browserify 代替 path
            crypto:  false                               // 浏览器环境不需要 crypto
        }
    },

    module: {
        rules: [
            { test: /\.ts$/,  use: 'ts-loader', exclude: /node_modules/ },
            { test: /\.css$/i, use: ['style-loader','css-loader'] },
            { test: /\.(png|jpe?g|gif)$/i, type: 'asset/resource' }
        ]
    },

    plugins: [
        new Dotenv({ path: './.env', safe: false }),
        new webpack.ProvidePlugin({ process: 'process/browser' })
    ],

    devServer: {
        static:            path.join(__dirname, 'public'),
        historyApiFallback:true,
        port:              8080,
        open:              true
    }
};