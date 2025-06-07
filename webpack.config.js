const path = require('path');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
        publicPath: '/'
    },
    resolve: {
        extensions: ['.ts', '.js'],
        alias: {
            '@modules': path.resolve(__dirname, 'src/modules/')
        }
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/
            },
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                type: 'asset/resource'
            }
        ]
    },
    devtool: 'source-map',
    devServer: {
        static: {
            directory: path.join(__dirname, 'public')
        },
        historyApiFallback: true,
        compress: true,
        port: 8080,
        open: true
    }
};
