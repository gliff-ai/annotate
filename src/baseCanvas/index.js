"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
var react_1 = require("react");
var BaseCanvas = /** @class */ (function (_super) {
    __extends(BaseCanvas, _super);
    function BaseCanvas(props) {
        var _this = _super.call(this, props) || this;
        _this.handleCanvasResize = function (entries) {
            for (var _i = 0, entries_1 = entries; _i < entries_1.length; _i++) {
                var entry = entries_1[_i];
                var _a = entry.contentRect, width = _a.width, height = _a.height;
                _this.setCanvasSize(width, height);
            }
        };
        _this.setCanvasSize = function (width, height) {
            _this.canvas.current.width = width;
            _this.canvas.current.height = height;
            _this.canvas.current.style.width = width + "px";
            _this.canvas.current.style.height = height + "px";
        };
        _this.getContext = function () {
            _this.canvasContext = _this.canvas.current.getContext("2d");
        };
        _this.componentDidMount = function () {
            _this.canvasObserver = new ResizeObserver(function (entries) {
                return _this.handleCanvasResize(entries);
            });
            _this.canvasObserver.observe(_this.canvas.current);
        };
        _this.componentWillUnmount = function () {
            _this.canvasObserver.unobserve(_this.canvas.current);
        };
        _this.addImageToCanvas = function (array, width, height) {
            var imageData = _this.canvasContext.createImageData(width, height);
            imageData.data.set(array);
            _this.canvasContext.putImageData(imageData, 0, 0);
        };
        _this.render = function () {
            return (React.createElement("canvas", { width: "1000", height: "1000", key: _this.name, id: _this.name + "-canvas", ref: _this.canvas }));
        };
        _this.name = props.name;
        _this.canvas = react_1.createRef();
        return _this;
    }
    return BaseCanvas;
}(react_1.Component));
exports.BaseCanvas = BaseCanvas;
