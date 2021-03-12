const HtmlWebpackPlugin = require("html-webpack-plugin");

const port = process.env.PORT || 3000;

module.exports = {
  entry: "./src/index.tsx",
  mode: "development",
  devtool: "source-map",
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.(s*)css$/,
        use: ["style-loader", "css-loader", "sass-loader"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "public/index.html",
      favicon: "public/favicon.ico",
    }),
    new HtmlWebpackPlugin({
      template: "public/autoload.html",
      favicon: "public/favicon.ico",
      filename: "autoload.html",
    }),
  ],
  devServer: {
    host: "localhost",
    port,
    historyApiFallback: true,
    open: true,
  },
};
