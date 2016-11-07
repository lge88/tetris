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
  }

  clear() {
    const { width, height } = this._ctx.canvas;
    this._ctx.save();
    this._ctx.clearRect(0, 0, width, height );
    this._ctx.restore();
  }

  drawBanner({ text, color = 'red' }) {
    this._ctx.save();
    const { width, height } = this._ctx.canvas;
    const cx = 0.5 * width, cy = 0.5 * height;
    this._ctx.font = '48px serif';
    this._ctx.fillStyle = color;
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

  drawPixels({ pixels, color, debug = false }) {
    const { _dx: dx, _dy: dy, _pixelWidth: w, _pixelHeight: h } = this;
    this._ctx.save();
    this._ctx.fillStyle = color;
    pixels.forEach((pixel) => {
      const { x, y } = pixel;
      const p = { x: x * dx, y: y * dy };
      this._ctx.fillRect(p.x, p.y, w, h);
    });

    if (debug === true) {
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

  // Returns { min: {x, y}, max: {x, y} };
  bounds() {
    return this.pixels().reduce((sofar, p) => ({
      min: { x: Math.min(sofar.min.x, p.x), y: Math.min(sofar.min.y, p.y) },
      max: { x: Math.max(sofar.max.x, p.x), y: Math.max(sofar.max.y, p.y) }
    }), {
      min: { x: +Infinity, y: +Infinity },
      max: { x: -Infinity, y: -Infinity }
    });
  }
}

const PieceConfigurations = {
  L: [
    [ { x: +0, y: +0 }, { x: +0, y: +1 }, { x: +0, y: +2 }, { x: +1, y: +2 } ], // L0
    [ { x: +1, y: +1 }, { x: +0, y: +1 }, { x: -1, y: +1 }, { x: -1, y: +2 } ], // L1
    [ { x: +0, y: +2 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: -1, y: +0 } ], // L2
    [ { x: -1, y: +1 }, { x: +0, y: +1 }, { x: +1, y: +1 }, { x: +1, y: +0 } ], // L3
  ],
  J: [
    [ { x: -1, y: +1 }, { x: +0, y: -1 }, { x: +0, y: +0 }, { x: +0, y: +1 } ], // J0
    [ { x: -1, y: -1 }, { x: +1, y: +0 }, { x: +0, y: +0 }, { x: -1, y: +0 } ], // J1
    [ { x: +1, y: -1 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: +0, y: -1 } ], // J2
    [ { x: +1, y: +1 }, { x: -1, y: +0 }, { x: +0, y: +0 }, { x: +1, y: +0 } ], // J3
  ],
  O: [
    [ { x: +0, y: +0 }, { x: +0, y: +1 }, { x: +1, y: +0 }, { x: +1, y: +1 } ], // O
  ],
  I: [
    [ { x: +0, y: -1 }, { x: +0, y: +0 }, { x: +0, y: +1 }, { x: +0, y: +2 } ], // I0
    [ { x: +1, y: +0 }, { x: +0, y: +0 }, { x: -1, y: +0 }, { x: -2, y: +0 } ], // I1
    [ { x: +0, y: +2 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: +0, y: -1 } ], // I2
    [ { x: -1, y: +0 }, { x: +0, y: +0 }, { x: +1, y: +0 }, { x: +2, y: +0 } ], // I3
  ],
  S: [
    [ { x: -1, y: +0 }, { x: +0, y: -1 }, { x: +0, y: +0 }, { x: +1, y: -1 } ], // S0
    [ { x: +0, y: -1 }, { x: +1, y: +0 }, { x: +0, y: +0 }, { x: +1, y: +1 } ], // S1
    [ { x: +1, y: +0 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: -1, y: +1 } ], // S2
    [ { x: +0, y: +1 }, { x: -1, y: +0 }, { x: +0, y: +0 }, { x: -1, y: -1 } ], // S3
  ],
  Z: [
    [ { x: -1, y: -1 }, { x: +0, y: -1 }, { x: +0, y: +0 }, { x: +1, y: +0 } ], // Z0
    [ { x: +1, y: -1 }, { x: +1, y: +0 }, { x: +0, y: +0 }, { x: +0, y: +1 } ], // Z1
    [ { x: +1, y: +1 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: -1, y: +0 } ], // Z2
    [ { x: -1, y: +1 }, { x: -1, y: +0 }, { x: +0, y: +0 }, { x: +0, y: -1 } ], // Z3
  ],
  T: [
    [ { x: -1, y: +0 }, { x: +0, y: -1 }, { x: +0, y: +0 }, { x: +1, y: +0 } ], // T0
    [ { x: +0, y: -1 }, { x: +1, y: +0 }, { x: +0, y: +0 }, { x: +0, y: +1 } ], // T1
    [ { x: +1, y: +0 }, { x: +0, y: +1 }, { x: +0, y: +0 }, { x: -1, y: +0 } ], // T2
    [ { x: +0, y: +1 }, { x: -1, y: +0 }, { x: +0, y: +0 }, { x: +0, y: -1 } ], // T3
  ]
};

const L = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.L });
};
const L0 = ({ x, y, color }) => L({ x, y, i: 0, color });
const L1 = ({ x, y, color }) => L({ x, y, i: 1, color });
const L2 = ({ x, y, color }) => L({ x, y, i: 2, color });
const L3 = ({ x, y, color }) => L({ x, y, i: 3, color });

const J = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.J });
};
const J0 = ({ x, y, color }) => J({ x, y, i: 0, color });
const J1 = ({ x, y, color }) => J({ x, y, i: 1, color });
const J2 = ({ x, y, color }) => J({ x, y, i: 2, color });
const J3 = ({ x, y, color }) => J({ x, y, i: 3, color });

const O = ({ x, y, color }) => {
  return new Piece({ x, y, i: 0, color, configurations: PieceConfigurations.O });
};

const I = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.I });
};
const I0 = ({ x, y, color }) => I({ x, y, i: 0, color });
const I1 = ({ x, y, color }) => I({ x, y, i: 1, color });
const I2 = ({ x, y, color }) => I({ x, y, i: 2, color });
const I3 = ({ x, y, color }) => I({ x, y, i: 3, color });

const S = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.S });
};
const S0 = ({ x, y, color }) => S({ x, y, i: 0, color });
const S1 = ({ x, y, color }) => S({ x, y, i: 1, color });
const S2 = ({ x, y, color }) => S({ x, y, i: 2, color });
const S3 = ({ x, y, color }) => S({ x, y, i: 3, color });

const Z = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.Z });
};
const Z0 = ({ x, y, color }) => Z({ x, y, i: 0, color });
const Z1 = ({ x, y, color }) => Z({ x, y, i: 1, color });
const Z2 = ({ x, y, color }) => Z({ x, y, i: 2, color });
const Z3 = ({ x, y, color }) => Z({ x, y, i: 3, color });

const T = ({ x, y, i, color }) => {
  return new Piece({ x, y, i, color, configurations: PieceConfigurations.T });
};
const T0 = ({ x, y, color }) => T({ x, y, i: 0, color });
const T1 = ({ x, y, color }) => T({ x, y, i: 1, color });
const T2 = ({ x, y, color }) => T({ x, y, i: 2, color });
const T3 = ({ x, y, color }) => T({ x, y, i: 3, color });

// Generate a random int in [0, n-1] inclusive
function randomInt(n) {
  return Math.floor(n * Math.random());
}

function randomPick(arr) {
  return arr[randomInt(arr.length)];
}

class Game {
  // configs:
  // cavasId
  // nx
  // ny
  // spacingRatio
  // frameInterval
  constructor(config) {
    Object.assign(this, config);

    this.animationId = null;
    this.animate = this.animate.bind(this);
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.update = this.update.bind(this);
    this.render = this.render.bind(this);
    this.pixelToIndex = this.pixelToIndex.bind(this);
    this.indexToPixel = this.indexToPixel.bind(this);
  }

  start() {
    this.stop();

    const { canvasId, nx, ny, spacingRatio } = this;

    this.renderer = new Canvas2DRenderer({ canvasId, nx, ny, spacingRatio });

    this.piece = this.generateNewPiece();
    this.board = Array.apply(null, Array(nx * ny)).map(() => false);

    this.frameCount = 0;
    this.speed = 1;
    this.lastUpdateTime = 0;
    this.gameState = {
      error: null,
      score: 0
    };

    document.addEventListener('keydown', this.onKeyDown);
    document.addEventListener('keyup', this.onKeyUp);
    this.animationId = requestAnimationFrame(this.animate);
  }

  stop() {
    cancelAnimationFrame(this.animationId);
    document.removeEventListener('keydown', this.onKeyDown);
    document.removeEventListener('keyup', this.onKeyUp);
  }

  animate(ts) {
    const { error } = this.gameState;
    if (error !== null) {
      this.render();
      return;
    }

    const { frameCount, frameInterval, speed } = this;
    const delta = ts - this.lastUpdateTime;
    const interval = frameInterval / speed;
    if (delta >= interval) {
      this.frameCount++;
      this.update();
      this.lastUpdateTime = ts;
    }
    this.render();
    this.animationId = requestAnimationFrame(this.animate);
  }

  // shift piece horizontally if any of its part out of left/right
  // edge.
  makeInside(piece) {
    const { nx } = this;
    const bounds = piece.bounds();
    const { min, max } = bounds;

    if (min.x < 0) {
      return piece.translated({ x: -min.x, y: 0 });
    }

    if (max.x >= nx) {
      return piece.translated({ x: nx - 1 - max.x, y: 0 });
    }

    return piece;
  }

  rotatePiece() {
    let newPiece = this.piece.rotated();

    // Can not rotate because new piece overlap with exist ones
    if (this.isOverlapWithExistingPieces(newPiece)) return;

    // check if newPiece out of bounds, shift toward inside
    newPiece = this.makeInside(newPiece);

    // Can not rotate because new piece is under ground
    if (this.isUnderGround(newPiece)) return;

    this.piece = newPiece;
  }

  moveLeft() {
    let newPiece = this.piece.translated({ x: -1, y: +0 });
    if (this.isOverlapWithExistingPieces(newPiece)) return;
    newPiece = this.makeInside(newPiece);
    this.piece = newPiece;
  }

  moveRight() {
    let newPiece = this.piece.translated({ x: +1, y: +0 });
    if (this.isOverlapWithExistingPieces(newPiece)) return;
    newPiece = this.makeInside(newPiece);
    this.piece = newPiece;
  }

  onKeyDown(e) {
    // console.log('press', e);
    switch (e.keyCode) {
    case 37:
    case 65:
      // <- or 'a'
      this.moveLeft(); break;

    case 39:
    case 68:
      // -> or 'd'
      this.moveRight(); break;

    case 40:
    case 83:
      // down arrow or 's'
      this.speed = 10; break;

    case 32:
      // space to rotate
      this.rotatePiece(); break;

    default:
      break;
    }
    e.stopPropagation();
  }

  onKeyUp(e) {
    switch (e.keyCode) {
    case 40:
    case 83:
      // down arrow or 's'
      this.speed = 1; break;
    default:
      break;
    }
    e.stopPropagation();
  }

  generateNewPiece() {
    // Choose a piece randomly (type, color)
    // const colors = [ 'red', 'green', 'purple', 'yellow', 'blue' ];
    // const color = randomPick(colors);
    const color = 'yellow';
    const ctrs = [
      L0, L1, L2, L3,
      J0, J1, J2, J3,
      O,
      I0, I1, I2, I3,
      S0, S1, S2, S3,
      Z0, Z1, Z2, Z3,
      T0, T1, T2, T3,
    ];
    const T = randomPick(ctrs);
    return T({ x: this.nx >> 1, y: -1, color });
  }

  isUnderGround(piece) {
    const { ny } = this;
    const { max } = piece.bounds();
    return max.y >= ny;
  }

  isTouchedGround(piece) {
    const { ny } = this;
    const { max } = piece.bounds();
    return max.y + 1 >= ny;
  }

  isOverlapWithExistingPieces(piece) {
    return piece.pixels().some(p => this.board[this.pixelToIndex(p)]);
  }

  isTouchedExistingPieces(piece) {
    return this.isOverlapWithExistingPieces(piece.down());
  }

  fixPiece(piece) {
    piece.pixels().forEach((p) => {
      this.board[this.pixelToIndex(p)] = true;
    });
  }

  tryKillRows() {
    const { nx, ny, board } = this;

    let tail = ny;
    for (let y = ny - 1; y >= -1; --y) {
      let shouldKillThisRow = true;
      for (let x = 0; x < nx; ++x) {
        const i = this.pixelToIndex({ x, y });
        if (board[i] !== true) {
          shouldKillThisRow = false;
          break;
        }
      }

      if (shouldKillThisRow === false) {
        --tail;
        for (let x = 0; x < nx; ++x) {
          const i = this.pixelToIndex({ x, y: tail });
          const j = this.pixelToIndex({ x, y });
          board[i] = board[j];
        }
      }
    }
  }

  update() {
    const piece = this.piece;
    const touchedGround = this.isTouchedGround(piece);
    const touchedExistingPieces = this.isTouchedExistingPieces(piece);
    const bounds = piece.bounds();

    // Check if game over.
    if (bounds.min.y <= 0 && touchedExistingPieces) {
      this.gameState.error = 'Game over';
      return;
    }

    if (touchedGround || touchedExistingPieces) {
      this.fixPiece(piece);
      // console.log(JSON.stringify(piece.pixels()));
      // console.log(JSON.stringify(this.board));
      this.tryKillRows();
      this.piece = this.generateNewPiece();
      return;
    }

    this.piece = this.piece.down();
  }

  pixelToIndex({ x, y }) {
    return y * this.nx + x;
  }

  indexToPixel(i) {
    const nx = this.nx;
    return { x: i % nx, y: Math.floor(i / nx) };
  }

  render() {
    const { renderer, piece, board } = this;
    const { gameState } = this;
    const { error } = gameState;
    if (error !== null) {
      renderer.drawBanner({ text: error });
      return;
    }

    renderer.clear();
    piece.draw(renderer);

    const filled = board.map((isFilled, i) => Object.assign(this.indexToPixel(i), { isFilled }))
      .filter((p) => p.isFilled)
      .map(({ x, y }) => ({ x, y }));
    renderer.drawPixels({ pixels: filled, color: 'blue' });
  }
}

var game = new Game;
game.canvasId = 'canvas';
game.nx = 10;
game.ny = 20;
game.spacingRatio = 0.1;
game.frameInterval = 500;
game.start();
