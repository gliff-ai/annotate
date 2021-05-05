const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyPlugin = require("copy-webpack-plugin");
const path = require("path");

const port = process.env.PORT || 3000;

function resolve(dir) {
  return path.join(__dirname, "..", dir);
}

module.exports = {
  entry: "./examples/src/index.tsx",
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
