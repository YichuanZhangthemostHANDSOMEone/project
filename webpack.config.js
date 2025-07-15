const path    = require('path');
const webpack = require('webpack');
const Dotenv  = require('dotenv-webpack');

module.exports = {
    mode: 'development',

    entry: {
        main:         './src/index.ts',
        topics:       './src/topics.ts',
        quiz:         './src/quiz.ts',
        result:       './src/result.ts',
        'lego-result': './src/legoResult.ts'
    },

    output: {
        filename:   '[name].bundle.js',
        path:       path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },

    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@modules':            path.resolve(__dirname, 'src/modules'),
            // 只匹配精确的 'process/browser' 导入：
            'process/browser$':    require.resolve('process/browser')
        },
        fallback: {
            // Node 核心模块的 polyfill
            process:              require.resolve('process/browser'),
            util:                 require.resolve('util/'),
            path:                 require.resolve('path-browserify'),
            fs:                   false,
            crypto:               false
        }
    },

    module: {
        rules: [
            { test: /\.ts$/,  use: 'ts-loader',        exclude: /node_modules/ },
            { test: /\.css$/i, use: ['style-loader','css-loader'] },
            { test: /\.(png|jpe?g|gif)$/i, type: 'asset/resource' }
        ]
    },

    plugins: [
        new Dotenv({ path: './.env', safe: false }),
        new webpack.ProvidePlugin({
            // 任何地方用到 `process` 都自动引入这个 polyfill
            process: 'process/browser'
        })
    ],

    devServer: {
        static:             path.join(__dirname, 'public'),
        historyApiFallback: true,
        port:               8080,
        open:               true
    }
};