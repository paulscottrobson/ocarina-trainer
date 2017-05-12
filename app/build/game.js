var __extends = (this && this.__extends) || (function () {
    var extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var GameState = (function (_super) {
    __extends(GameState, _super);
    function GameState() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    GameState.prototype.create = function () {
        var bgr = this.game.add.image(0, 0, "sprites", "background");
        bgr.width = this.game.width;
        bgr.height = this.game.height;
        var musd = this.game.cache.getJSON("music");
        var mus = new Music(musd);
        var mgr = new Manager(this.game, mus, this.game.width - 128, this.game.height - 128);
        mgr.x = mgr.y = 64;
    };
    GameState.prototype.destroy = function () {
    };
    GameState.prototype.update = function () {
    };
    return GameState;
}(Phaser.State));
window.onload = function () {
    var game = new OcarinaTrainer();
};
var OcarinaTrainer = (function (_super) {
    __extends(OcarinaTrainer, _super);
    function OcarinaTrainer() {
        var _this = _super.call(this, 1280, 1024, Phaser.AUTO, "", null, false, false) || this;
        _this.state.add("Boot", new BootState());
        _this.state.add("Preload", new PreloadState());
        _this.state.add("Main", new GameState());
        _this.state.start("Boot");
        return _this;
    }
    return OcarinaTrainer;
}(Phaser.Game));
var BootState = (function (_super) {
    __extends(BootState, _super);
    function BootState() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    BootState.prototype.preload = function () {
        this.game.load.image("loader", "assets/sprites/loader.png");
        this.game.load.json("music", "music.json");
    };
    BootState.prototype.create = function () {
        this.game.scale.pageAlignHorizontally = true;
        this.game.scale.pageAlignVertically = true;
        this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
        this.game.state.start("Preload", true, false, 1);
    };
    return BootState;
}(Phaser.State));
var Manager = (function (_super) {
    __extends(Manager, _super);
    function Manager(game, music, width, height) {
        if (width === void 0) { width = null; }
        if (height === void 0) { height = null; }
        var _this = _super.call(this, game) || this;
        _this.drawWidth = width || game.width;
        _this.drawHeight = height || game.height;
        _this.music = music;
        _this.onSelect = new Phaser.Signal();
        _this.renderer = null;
        _this.fitToArea();
        _this.redrawAll();
        _this.layout();
        _this.controlGraphics();
        return _this;
    }
    Manager.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.musicCursor = this.onSelect = this.music = this.renderer = null;
    };
    Manager.prototype.redrawAll = function () {
        if (this.renderer == null) {
            this.renderer = [];
            for (var n = 0; n < this.music.count; n++) {
                this.renderer[n] = new Renderer(this.game, this.music.bar[n]);
                this.add(this.renderer[n]);
            }
        }
        else {
            for (var n = 0; n < this.music.count; n++) {
                this.renderer[n].renderBar();
            }
        }
    };
    Manager.prototype.moveCursor = function (bar, note) {
        this.musicCursor.x = this.renderer[bar].x + this.renderer[bar].getX(note);
        this.musicCursor.y = this.renderer[bar].y;
    };
    Manager.prototype.controlGraphics = function () {
        var img = this.game.add.image(0, 0, "sprites", "rectangle", this);
        img.width = this.drawWidth;
        img.height = this.drawHeight;
        img.tint = 0x000080;
        img.alpha = 0.0;
        img.inputEnabled = true;
        img.events.onInputDown.add(this.clickHandler, this);
        this.musicCursor = this.game.add.image(0, 0, "sprites", "rectangle", this);
        this.musicCursor.tint = 0x0040C0;
        this.musicCursor.alpha = 0.35;
        this.musicCursor.anchor.setTo(0.5, 0);
        this.musicCursor.width = Renderer.noteWidth;
        this.musicCursor.height = Renderer.totalHeight;
        this.moveCursor(0, 0);
    };
    Manager.prototype.clickHandler = function (obj, ptr) {
        var x = ptr.x - this.x;
        var y = ptr.y - this.y;
        for (var bar = 0; bar < this.music.count; bar++) {
            var b = this.renderer[bar];
            if (x >= b.x && y >= b.y && x < b.x + b.getWidth() && y < b.y + b.getHeight()) {
                var note = b.getNote(x - b.x);
                this.onSelect.dispatch(this, bar, note);
                this.moveCursor(bar, note);
            }
        }
    };
    Manager.prototype.fitToArea = function () {
        var fitted = false;
        Renderer.noteWidth = 128;
        while (!fitted) {
            Renderer.totalHeight = Math.round(Renderer.noteWidth * 2.8);
            if (this.calculateHeight(Renderer.noteWidth, Renderer.totalHeight) < this.drawHeight) {
                fitted = true;
            }
            else {
                Renderer.noteWidth = Math.round(Renderer.noteWidth / 1.04);
            }
        }
    };
    Manager.prototype.layout = function () {
        var x = 0;
        var y = 0;
        for (var b = 0; b < this.music.count; b++) {
            var width = this.renderer[b].getWidth();
            if (x + width > this.drawWidth) {
                x = 0;
                y = y + this.renderer[b].getHeight();
            }
            this.renderer[b].x = x;
            this.renderer[b].y = y;
            x = x + width;
        }
    };
    Manager.prototype.calculateHeight = function (noteSize, height) {
        var x = 0;
        var y = 0;
        for (var b = 0; b < this.music.count; b++) {
            var width = noteSize * this.music.bar[b].count;
            if (width > this.drawWidth) {
                return 999999;
            }
            if (x + width > this.drawWidth) {
                x = 0;
                y = y + height;
            }
            x = x + width;
        }
        return y + height - 1;
    };
    return Manager;
}(Phaser.Group));
var PreloadState = (function (_super) {
    __extends(PreloadState, _super);
    function PreloadState() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    PreloadState.prototype.preload = function () {
        var _this = this;
        this.game.stage.backgroundColor = "#000000";
        var loader = this.add.sprite(this.game.width / 2, this.game.height / 2, "loader");
        loader.width = this.game.width * 9 / 10;
        loader.height = this.game.height / 8;
        loader.anchor.setTo(0.5);
        this.game.load.setPreloadSprite(loader);
        this.game.load.bitmapFont("font", "assets/fonts/font.png", "assets/fonts/font.fnt");
        this.game.load.bitmapFont("7seg", "assets/fonts/7seg.png", "assets/fonts/7seg.fnt");
        this.game.load.atlas("sprites", "assets/sprites/sprites.png", "assets/sprites/sprites.json");
        this.game.load.atlas("ocarina", "assets/sprites/6-hole-atlas.png", "assets/sprites/6-hole-atlas.json");
        this.game.load.spritesheet("notes", "assets/sprites/notes.png", 200, 200);
        for (var i = 1; i <= PreloadState.NOTE_COUNT; i++) {
            var sound = i.toString();
            this.game.load.audio(sound, ["assets/sounds/" + sound + ".mp3", "assets/sounds/" + sound + ".ogg"]);
        }
        this.game.load.audio("metronome", ["assets/sounds/metronome.mp3", "assets/sounds/metronome.ogg"]);
        this.game.load.onLoadComplete.add(function () { _this.game.state.start("Main", true, false, 1); }, this);
    };
    return PreloadState;
}(Phaser.State));
PreloadState.NOTE_COUNT = 42;
var Renderer = (function (_super) {
    __extends(Renderer, _super);
    function Renderer(game, bar) {
        var _this = _super.call(this, game) || this;
        _this.bar = bar;
        _this.renderBar();
        return _this;
    }
    Renderer.prototype.destroy = function () {
        _super.prototype.destroy.call(this);
        this.bar = null;
    };
    Renderer.prototype.renderBar = function () {
        this.clearGroup();
        if (Renderer.DEBUG) {
            this.debugFrame();
        }
        this.yPos = 0;
        this.yHeight = this.getHeight();
        if (Renderer.showOcarina || Renderer.showStave) {
            if (Renderer.showOcarina && Renderer.showStave) {
                this.yHeight = this.yHeight * 0.6;
                this.renderStave();
                this.yPos = this.yHeight;
                this.yHeight = this.getHeight() - this.yHeight;
                this.renderOcarina();
            }
            else {
                if (Renderer.showOcarina) {
                    this.renderOcarina();
                }
                else {
                    this.renderStave();
                }
            }
        }
    };
    Renderer.prototype.getWidth = function () {
        return Renderer.noteWidth * this.bar.count;
    };
    Renderer.prototype.getHeight = function () {
        return Renderer.totalHeight;
    };
    Renderer.prototype.clearGroup = function () {
        this.forEachAlive(function (obj) { obj.pendingDestroy = true; }, this);
    };
    Renderer.prototype.debugFrame = function () {
        var img = this.game.add.image(0, 0, "sprites", "frame", this);
        img.width = this.getWidth();
        img.height = this.getHeight();
        img.tint = 0xFF8000;
        img.alpha = 0.5;
    };
    Renderer.prototype.renderStave = function () {
        var img;
        for (var n = 2; n < 7; n++) {
            this.drawStaveOrNoteLine(n, 0);
        }
        for (var n = 0; n < 2; n++) {
            img = this.game.add.image(this.getWidth() * n, this.getYStave(6), "sprites", "rectangle", this);
            img.anchor.setTo(0.5, 0);
            img.tint = 0;
            img.height = this.getYStave(2) - this.getYStave(6);
            img.width = Math.max(this.yHeight / 24, 2);
        }
        for (var n = 0; n < this.bar.count; n++) {
            var nv = this.bar.note[n].chromaticOffset;
            img = this.game.add.image(this.getX(n), this.getYStave(4), "notes", 5, this);
            img.anchor.setTo(0.5, 0.5);
            img.scale.x = img.scale.y = 0.9 * this.yHeight / img.height;
            if (nv == Note.REST) {
                img.frame = (this.bar.note[n].quarterBeatLength < 4) ? 2 : 5;
            }
            else {
                var frameID = this.bar.note[n].noteImage * 3;
                var pos = Renderer.TO_POSX2[nv % 12] / 2;
                if (nv >= 12) {
                    pos = pos + 3.5;
                }
                if (pos >= 4) {
                    frameID++;
                }
                if (this.bar.note[n].quarterBeatLength == 16) {
                    frameID = 20;
                }
                img.frame = frameID;
                img.y = this.getYStave(pos);
                if (pos <= 1) {
                    this.drawStaveOrNoteLine(1, n);
                }
                if (pos == 0) {
                    this.drawStaveOrNoteLine(0, n);
                }
                if (Renderer.IS_SHARP[nv % 12] != 0) {
                    var shp = this.game.add.image(img.x, img.y, "sprites", "sharp", this);
                    shp.anchor.setTo(0.5, 0.5);
                    shp.scale.x = shp.scale.y = this.yHeight / 5 / shp.height;
                    shp.x -= shp.width * 1.3;
                }
            }
        }
    };
    Renderer.prototype.drawStaveOrNoteLine = function (n, x) {
        var img = this.game.add.image(0, this.getYStave(n), "sprites", "rectangle", this);
        img.anchor.setTo(0, 0.5);
        img.tint = 0;
        img.width = this.getWidth();
        img.height = Math.max(this.yHeight / 48, 1);
        if (n < 2) {
            img.x = this.getX(x);
            img.anchor.setTo(0.5, 0.5);
            img.width = Renderer.noteWidth * 0.6;
        }
    };
    Renderer.prototype.getX = function (n) {
        return (n + 0.5) * Renderer.noteWidth;
    };
    Renderer.prototype.getYStave = function (n) {
        return (7 - n) * this.yHeight / 7.7 + this.yPos;
    };
    Renderer.prototype.getNote = function (x) {
        return Math.floor(x / Renderer.noteWidth);
    };
    Renderer.prototype.renderOcarina = function () {
        for (var n = 0; n < this.bar.count; n++) {
            var nn = this.bar.note[n].chromaticOffset;
            if (nn != Note.REST) {
                var img = this.game.add.image(this.getX(n), this.yPos + this.yHeight / 2, "ocarina", nn.toString(), this);
                img.anchor.setTo(0.5, 0.5);
                var sx = Renderer.noteWidth / img.width * 0.95;
                var sy = this.yHeight / img.height;
                img.scale.x = img.scale.y = Math.min(sx, sy);
            }
        }
    };
    return Renderer;
}(Phaser.Group));
Renderer.noteWidth = 96;
Renderer.totalHeight = 300;
Renderer.showStave = true;
Renderer.showOcarina = true;
Renderer.DEBUG = false;
Renderer.TO_POSX2 = [
    0, 0, 1, 2, 2, 3, 3, 4, 5, 5, 6, 6
];
Renderer.IS_SHARP = [
    0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 1
];
var Bar = (function () {
    function Bar(barNumber, beats) {
        this.note = [];
        this.count = 0;
        this.barNumber = barNumber;
        this.beats = beats;
    }
    Bar.prototype.load = function (defn) {
        for (var p = 0; p < defn.length; p += 2) {
            var note = new Note();
            note.chromaticOffset = defn.charCodeAt(p) - 65;
            if (defn.charAt(p) == '-') {
                note.chromaticOffset = Note.REST;
            }
            note.noteImage = defn.charCodeAt(p + 1) - 48;
            note.quarterBeatLength = Bar.LENGTH[note.noteImage];
            this.note[this.count] = note;
            this.count++;
        }
        var mb = 0;
        for (var n = 0; n < this.count; n++) {
            this.note[n].mbTime = mb;
            this.note[n].mbLength = Math.round(this.note[n].quarterBeatLength * (1000 / this.beats / 4));
            mb = mb + this.note[n].mbLength;
        }
    };
    Bar.prototype.toString = function () {
        var s = "";
        for (var n = 0; n < this.count; n++) {
            var name = Bar.TONOTE[this.note[n].chromaticOffset % 12].toLowerCase();
            if (this.note[n].chromaticOffset >= 12) {
                name = name.toUpperCase();
            }
            s = s + name + "." + this.note[n].mbTime.toString() + "." + this.note[n].mbLength.toString() + " ";
        }
        return s;
    };
    return Bar;
}());
Bar.LENGTH = [1, 2, 3, 4, 6, 8, 12, 16];
Bar.TONOTE = ["a", "a#", "b", "c", "c#", "d", "d#", "e", "f", "f#", "g", "g#"];
var Music = (function () {
    function Music(data) {
        this.name = data["name"];
        this.author = data["author"];
        this.beats = data["beats"];
        this.beatsPerMinute = data["speed"];
        this.bar = [];
        this.count = 0;
        for (var _i = 0, _a = data["bars"]; _i < _a.length; _i++) {
            var barDef = _a[_i];
            var b = new Bar(this.count, this.beats);
            b.load(barDef);
            this.bar[this.count] = b;
            this.count++;
        }
    }
    return Music;
}());
var Note = (function () {
    function Note() {
    }
    return Note;
}());
Note.REST = -1;
