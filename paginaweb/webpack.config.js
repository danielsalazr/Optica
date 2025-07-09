const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin =  require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const { CleanWebpackPlugin} = require('clean-webpack-plugin');

module.exports = {
    entry: './src/index.js',
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
        publicPath:'/',
    },
    resolve: {
        extensions: ['.js','.jsx'],
        // alias: {
        //     '@components': path.resolve(__dirname, 'src/components'),
        //     '@styles': path.resolve(__dirname, 'src/styles'),
        // }
        alias: {
			// '@components':path.resolve(__dirname, 'src/components/'),
            '@icons':path.resolve(__dirname, 'src/assets/images/icons/'),
			'@logos':path.resolve(__dirname, 'src/assets/images/logos/'),
            '@lentes':path.resolve(__dirname, 'src/assets/images/lentes/'),
            '@brigadas':path.resolve(__dirname, 'src/assets/images/brigadas/'),
            '@metodospago':path.resolve(__dirname, 'src/assets/images/metodospago/'),
            '@info':path.resolve(__dirname, 'src/assets/images/info/'),
            '@styles':path.resolve(__dirname, 'src/styles/'),
        }
    },
    mode: 'production',
    module: {
        rules: [
            {
                test: /\.(js|jsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
            {
                test: /\.html$/,
                use:[
                    {
                        loader:'html-loader',
                    }
                ]
            },
            {
                test: /\.s?[ac]ss$/,
                // /\.(css|scss)$/
                use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
            },
            {
                test: /\.(png|jpe?g|gif)$/i,
                use: [
                  {
                    loader: 'file-loader',
                  },
                ],
            },
        ]
    },
    plugins:[
        new HtmlWebpackPlugin({
            template: './public/index.html',
            filename: './index.html'
        }),
        new MiniCssExtractPlugin({
            filename:'[name].css'
        }),
        new CleanWebpackPlugin(),
        
    ],
    
    optimization: {
        minimize: true,
        minimizer: [
            new CssMinimizerPlugin(),
            new TerserPlugin(),
        ]
    }
}