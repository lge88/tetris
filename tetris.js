class Canvas2DRenderer {
  constructor({ canvasId, nx, ny, spacingRatio }) {
    const canvas = document.getElementById(canvasId);
    const { width, height } = canvas;
    const dx = width / nx, dy = height / ny;
    const pixelWidth = dx / (1 + spacingRatio);
    const pixelHeight = dy / (1 + spacingRatio);

    this._dx = dx;
    this._dy = dy;
    this._pixelWidth = pixelWidth;
    this._pixelHeight = pixelHeight;
    this._ctx = canvas.getContext('2d');
    this.debug = false;
  }

  clear() {
    const { width, height } = this._ctx.canvas;
    this._ctx.save();
    this._ctx.clearRect(0, 0, width, height );
    this._ctx.restore();
  }

  drawBanner({ text }) {
    this._ctx.save();
    const { width, height } = this._ctx.canvas;
    const cx = 0.5 * width, cy = 0.5 * height;
    this._ctx.font = '48px serif';
    this._ctx.textAlign = 'center';
    this._ctx.textBaseline = 'middle';
    this._ctx.fillText(text, cx, cy);
    this._ctx.restore();
  }

  drawPixel({ x, y, color }) {
    const { _dx: dx, _dy: dy, _pixelWidth: w, _pixelHeight: h } = this;
    const p = { x: x * dx, y: y * dy };
    this._ctx.save();
    this._ctx.fillStyle = color;
    this._ctx.fillRect(p.x, p.y, w, h);
    this._ctx.restore();
    return this;
  }

  drawPixels({ pixels, color }) {
    const { _dx: dx, _dy: dy, _pixelWidth: w, _pixelHeight: h } = this;
    this._ctx.save();
    this._ctx.fillStyle = color;
    pixels.forEach((pixel) => {
      const { x, y } = pixel;
      const p = { x: x * dx, y: y * dy };
      this._ctx.fillRect(p.x, p.y, w, h);
    });

    if (this.debug === true) {
      this._ctx.font = '20px serif';
      this._ctx.textAlign = 'center';
      this._ctx.textBaseline = 'middle';
      this._ctx.fillStyle = 'black';
      pixels.forEach((pixel, i) => {
        const { x, y } = pixel;
        const p = { x: x * dx + 0.5 * w, y: y * dy + 0.5 * h };
        this._ctx.fillText(i + '', p.x, p.y);
      });
    }

    this._ctx.restore();
    return this;
  }
};

class Piece {
  constructor({ x, y, configurations, i, color }) {
    if (i >= configurations.length)
      throw new Error('Configuration index out of bound');

    this._offset = { x, y };
    this._configurations = configurations;
    this._i = i;
    this._color = color;
  }

  pixels() {
    const pixels = this._configurations[this._i];
    const { x: dx, y: dy } = this._offset;
    return pixels.map(({ x, y }) => ({ x: x + dx, y: y + dy }));
  }

  color() { return this._color; }

  translated({ x, y }) {
    const offset = this._offset;
    return new Piece({
      x: offset.x + x, y: offset.y + y,
      configurations: this._configurations,
      i: this._i,
      color: this._color
    });
  }

  down() {
    return this.translated({ x: +0, y: +1 });
  }

  rotated() {
    const configurations = this._configurations;
    const i = (this._i + 1) % configurations.length;
    const offset = this._offset;
    const { x, y } = { x: offset.x, y: offset.y };
    const color = this._color;
    return new Piece({x, y, i, configurations, color });
  }

  draw(renderer) {
    renderer.drawPixels({ pixels: this.pixels(), color: this.color() });
  }
}

const PieceConfigurations = {
  L: [
    [ { x: +0, y: +0 }, { x: +0, y: +1 }, { x: +0, y: +2 }, { x: +1, y: +2 } ], // L0
    [ { x: +1, y: +1 }, { x: +0, y: +1 }, { x: -1, y: +1 }, { x: -1, y: +2 } ], // L1
    [ { x: +0, y: +2 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: -1, y: +0 } ], // L2
    [ { x: -1, y: +1 }, { x: +0, y: +1 }, { x: +1, y: +1 }, { x: +1, y: +0 } ], // L3
  ]
};

const L = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.L });
};

const L0 = ({ x, y, color }) => L({ x, y, i: 0, color });
const L1 = ({ x, y, color }) => L({ x, y, i: 1, color });
const L2 = ({ x, y, color }) => L({ x, y, i: 2, color });
const L3 = ({ x, y, color }) => L({ x, y, i: 3, color });

var renderer = new Canvas2DRenderer({
  canvasId: 'canvas',
  nx: 10,
  ny: 20,
  spacingRatio: 0.1
});

var p0 = L0({ x: 5, y: 5, color: 'blue' });

function render() {
  renderer.clear();
  p0.draw(renderer);
}

function update() {
  p0 = p0.rotated();
}

renderer.debug = true;

function animate() {
  update();
  render();
  setTimeout(animate, 1000);
}

animate();
