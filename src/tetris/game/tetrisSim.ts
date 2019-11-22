import {Matrix} from "../obj/matrix/matrix";
import {Piece} from "../obj/piece/piece";
import {Generator} from "../../util/generator";
import {PiecePrototype} from "../obj/piece/piecePrototype";
import {Position} from "../obj/position";
import {getGhostPiece} from "../util/tetrisUtils";

export class TetrisSim {
    readonly matrix: Matrix;
    readonly fallingPiece: Piece;
    readonly heldPiece: PiecePrototype | undefined;
    readonly queue: Generator<PiecePrototype>;

    constructor(matrix: Matrix, fallingPiece: Piece, heldPiece: PiecePrototype | undefined, queue: Generator<PiecePrototype>) {
        this.matrix = matrix;
        this.fallingPiece = fallingPiece;
        this.heldPiece = heldPiece;
        this.queue = queue;
    }

    setMatrix(newMatrix: Matrix): TetrisSim {
        if (newMatrix !== this.matrix) {
            return new TetrisSim(newMatrix, this.fallingPiece, this.heldPiece, this.queue);
        }
        return this;
    }

    setPiece(newPiece: Piece): TetrisSim {
        if (newPiece !== this.fallingPiece) {
            return new TetrisSim(this.matrix, newPiece, this.heldPiece, this.queue);
        }
        return this;
    }

    setValidPiece(newPiece: Piece): TetrisSim {
        if (newPiece !== this.fallingPiece && this.matrix.isPieceValid(newPiece)) {
            return new TetrisSim(this.matrix, newPiece, this.heldPiece, this.queue);
        }
        return this;
    }

    setHeldPiece(newHeldPieceProto?: PiecePrototype): TetrisSim {
        if (newHeldPieceProto !== this.heldPiece) {
            return new TetrisSim(this.matrix, this.fallingPiece, newHeldPieceProto, this.queue);
        }
        return this;
    }

    setQueue(newQueue: Generator<PiecePrototype>): TetrisSim {
        if (newQueue !== this.queue) {
            return new TetrisSim(this.matrix, this.fallingPiece, this.heldPiece, newQueue);
        }
        return this;
    }


    movePiece(dPos: Position): TetrisSim {
        return this.setValidPiece(this.fallingPiece.translated(dPos));
    }

    hardDrop(): TetrisSim {
        return this.setValidPiece(getGhostPiece(this.fallingPiece, this.matrix));
    }

    rotateCw(): TetrisSim {
        return this.setValidPiece(this.fallingPiece.rotatedCw(piece => this.matrix.isPieceValid(piece)));
    }

    rotateCcw(): TetrisSim {
        return this.setValidPiece(this.fallingPiece.rotatedCcw(piece => this.matrix.isPieceValid(piece)));
    }

    spawnPiece(pieceProto: PiecePrototype): TetrisSim {
        // Don't use setValidPiece because we want to allow spawning new pieces in an invalid position (e.g. game over)
        return this.setPiece(new Piece(pieceProto, 0, this.matrix.spawnPos));
    }

    spawnNext(): TetrisSim {
        return this
            .spawnPiece(this.queue.get())
            .setQueue(this.queue.next());
    }

    lockPiece(): TetrisSim {
        const lockResult = this.matrix.lockPiece(this.fallingPiece);
        return this.setMatrix(lockResult.newMatrix);
    }

    lockPieceAndSpawnNext(): TetrisSim {
        return this.lockPiece().spawnNext();
    }

    swap(): TetrisSim {
        const newHeldPiece: PiecePrototype = this.fallingPiece.piecePrototype;
        if (this.heldPiece === undefined) {
            return this
                .setHeldPiece(newHeldPiece)
                .spawnNext();
        } else {
            return this
                .setHeldPiece(newHeldPiece)
                .spawnPiece(this.heldPiece)
        }
    }

    static newTetrisSim(matrix: Matrix, queue: Generator<PiecePrototype>): TetrisSim {
        return new TetrisSim(matrix, new Piece(queue.get(), 0, matrix.spawnPos), undefined, queue.next());
    }
}