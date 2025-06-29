// const path = require('path');
// const webpack = require('webpack');
// const dotenv = require('dotenv');
//
// const env = dotenv.config().parsed || {};
// const envKeys = Object.keys(env).reduce((prev, next) => {
//     prev[`process.env.${next}`] = JSON.stringify(env[next]);
//     return prev;
// }, {});
//
// module.exports = {
//     mode: 'development',
//     entry: {
//         main: './src/index.ts',      // AR 页面
//         quiz: './src/quiz.ts',       // Quiz 逻辑
//         result: './src/result.ts'    // 结果页面逻辑
//     },
//     output: {
//         filename: '[name].bundle.js',
//         path: path.resolve(__dirname, 'dist'),
//         publicPath: '/'
//     },
//     resolve: {
//         extensions: ['.ts', '.js'],
//         alias: { '@modules': path.resolve(__dirname, 'src/modules') },
//         fallback: { process: require.resolve('process/browser') }
//     },
//     module: {
//         rules: [
//             { test: /\.ts$/, use: 'ts-loader', exclude: /node_modules/ },
//             { test: /\.css$/i, use: ['style-loader','css-loader'] },
//             { test: /\.(png|jpe?g|gif)$/i, type: 'asset/resource' }
//         ]
//     },
//     plugins: [
//         new webpack.DefinePlugin(envKeys),
//         new webpack.ProvidePlugin({ process: 'process/browser' })
//     ],
//     devServer: {
//         static: path.join(__dirname, 'public'),
//         historyApiFallback: true,
//         port: 8080,
//         open: true
//     }
// };
// webpack.config.js
// webpack.config.js
// const path    = require('path');
// const webpack = require('webpack');
// const Dotenv  = require('dotenv-webpack');
//
// module.exports = {
//     mode: 'development',
//
//     // 多入口：main / topic / quiz / result
//     entry: {
//         main:   './src/index.ts',    // AR 页面
//         topics:  './src/topics.ts',    // Week 列表页
//         quiz:   './src/quiz.ts',     // Quiz 逻辑
//         result: './src/result.ts'    // 结果页面逻辑
//     },
//
//     output: {
//         filename:   '[name].bundle.js',   // 对应 main.bundle.js / topics.bundle.js / ...
//         path:       path.resolve(__dirname, 'dist'),
//         publicPath: '/'
//     },
//
//     resolve: {
//         extensions: ['.ts', '.js'],
//         alias: {
//             '@modules': path.resolve(__dirname, 'src/modules')
//         },
//         fallback: {
//             process: require.resolve('process/browser'),
//             fs:    false,                               // 不提供 fs
//             path:  require.resolve('path-browserify'),  // path ↦ path-browserify
//             crypto: require.resolve('crypto-browserify')// crypto ↦ crypto-browserify
//         }
//     },
//
//     module: {
//         rules: [
//             {
//                 test: /\.ts$/,
//                 use: 'ts-loader',
//                 exclude: /node_modules/
//             },
//             {
//                 test: /\.css$/i,
//                 use: ['style-loader','css-loader']
//             },
//             {
//                 test: /\.(png|jpe?g|gif)$/i,
//                 type: 'asset/resource'
//             }
//         ]
//     },
//
//     plugins: [
//         // 从根目录 .env 读取环境变量并注入到 process.env.*
//         new Dotenv({
//             path: './.env',
//             safe: false
//         }),
//
//         // polyfill 全局 process
//         new webpack.ProvidePlugin({
//             process: 'process/browser'
//         })
//     ],
//
//     devServer: {
//         static:            path.join(__dirname, 'public'),
//         historyApiFallback:true,
//         port:              8080,
//         open:              true
//     }
// };
const path    = require('path');
const webpack = require('webpack');
const Dotenv  = require('dotenv-webpack');

module.exports = {
    mode: 'development',

    // entry: {
    //     main:   './src/index.ts',
    //     topics: './src/topics.ts',
    //     quiz:   './src/quiz.ts',
    //     result: './src/result.ts'
    // },
    entry: {
        main:    './src/index.ts',
        topics:  './src/topics.ts',
         quiz:    './src/quiz.ts',
        result:  './src/result.ts',
        login:   './src/login.ts',
        register: './src/register.ts'
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