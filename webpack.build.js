const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const port = process.env.PORT || 3000;

module.exports = {
  entry: "./examples/src/index.tsx",
  mode: "development",
  devtool: "eval-source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.m?js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/react"],
            plugins: ["@babel/proposal-class-properties"],
          },
        },
      },
      {
        test: /\.(s*)css$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
      {
        test: /\.(jpe?g|png|gif|woff|woff2|eot|ttf|svg)(\?[a-z0-9=.]+)?$/,
        use: {
          loader: "url-loader",
          options: {
            name: "img/[name].[hash:8].[ext]",
            esModule: false,
          },
        },
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "examples/index.html",
    }),
    new CopyPlugin({
      patterns: [
        {
          from: "examples/zebrafish-heart.jpg",
          to: "zebrafish-heart.jpg",
        },
        {
          from: "src/assets",
          to: "assets",
        },
      ],
    }),
  ],
  devServer: {
    host: "localhost",
    port,
    historyApiFallback: true,
    open: true,
  },
};
