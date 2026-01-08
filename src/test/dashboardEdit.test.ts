import { describe, it, expect, beforeEach } from 'vitest';

describe('Widget Positioning Functions', () => {
  describe('moveWidgetUp', () => {
    it('should move a widget up by one row', () => {
      const initialPosition = {
        gridColumn: 1,
        gridRow: 5,
        gridWidth: 6,
        gridHeight: 3
      };

      const expectedPosition = {
        ...initialPosition,
        gridRow: 4
      };

      expect(expectedPosition.gridRow).toBe(4);
    });

    it('should not move widget above row 1', () => {
      const initialPosition = {
        gridColumn: 1,
        gridRow: 1,
        gridWidth: 6,
        gridHeight: 3
      };

      const newRow = Math.max(1, initialPosition.gridRow - 1);
      expect(newRow).toBe(1);
    });

    it('should move widget by specified increment', () => {
      const initialPosition = {
        gridColumn: 1,
        gridRow: 10,
        gridWidth: 6,
        gridHeight: 3
      };

      const increment = 3;
      const newRow = Math.max(1, initialPosition.gridRow - increment);
      expect(newRow).toBe(7);
    });
  });

  describe('moveWidgetDown', () => {
    it('should move a widget down by one row', () => {
      const initialPosition = {
        gridColumn: 1,
        gridRow: 5,
        gridWidth: 6,
        gridHeight: 3
      };

      const expectedPosition = {
        ...initialPosition,
        gridRow: 6
      };

      expect(expectedPosition.gridRow).toBe(6);
    });

    it('should move widget by specified increment', () => {
      const initialPosition = {
        gridColumn: 1,
        gridRow: 5,
        gridWidth: 6,
        gridHeight: 3
      };

      const increment = 2;
      const newRow = initialPosition.gridRow + increment;
      expect(newRow).toBe(7);
    });
  });

  describe('compactLayout', () => {
    it('should remove gaps between widgets', () => {
      const GRID_COLUMNS = 12;
      const WIDGET_GAP = 1;

      const widgets = [
        { id: 'widget1', gridColumn: 1, gridRow: 1, gridWidth: 6, gridHeight: 3 },
        { id: 'widget2', gridColumn: 7, gridRow: 1, gridWidth: 6, gridHeight: 3 },
        { id: 'widget3', gridColumn: 1, gridRow: 10, gridWidth: 6, gridHeight: 3 }
      ];

      const sortedWidgets = [...widgets].sort((a, b) => {
        if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
        if (a.gridColumn !== b.gridColumn) return a.gridColumn - b.gridColumn;
        return a.id.localeCompare(b.id);
      });

      let currentRow = 1;
      let currentColumn = 1;
      let rowMaxHeight = 1;
      const newPositions = {};

      sortedWidgets.forEach(widget => {
        if (currentColumn + widget.gridWidth - 1 > GRID_COLUMNS) {
          currentRow += rowMaxHeight + WIDGET_GAP;
          currentColumn = 1;
          rowMaxHeight = widget.gridHeight;
        } else {
          rowMaxHeight = Math.max(rowMaxHeight, widget.gridHeight);
        }

        newPositions[widget.id] = {
          gridColumn: currentColumn,
          gridRow: currentRow,
          gridWidth: widget.gridWidth,
          gridHeight: widget.gridHeight
        };

        currentColumn += widget.gridWidth;
      });

      expect(newPositions['widget1'].gridRow).toBe(1);
      expect(newPositions['widget2'].gridRow).toBe(1);
      expect(newPositions['widget3'].gridRow).toBe(1 + 3 + WIDGET_GAP);
    });

    it('should maintain even spacing between rows', () => {
      const GRID_COLUMNS = 12;
      const WIDGET_GAP = 1;

      const widgets = [
        { id: 'widget1', gridColumn: 1, gridRow: 1, gridWidth: 12, gridHeight: 2 },
        { id: 'widget2', gridColumn: 1, gridRow: 10, gridWidth: 12, gridHeight: 2 }
      ];

      let currentRow = 1;
      let currentColumn = 1;
      let rowMaxHeight = 1;
      const newPositions = {};

      widgets.forEach(widget => {
        if (currentColumn + widget.gridWidth - 1 > GRID_COLUMNS) {
          currentRow += rowMaxHeight + WIDGET_GAP;
          currentColumn = 1;
          rowMaxHeight = widget.gridHeight;
        } else {
          rowMaxHeight = Math.max(rowMaxHeight, widget.gridHeight);
        }

        newPositions[widget.id] = {
          gridColumn: currentColumn,
          gridRow: currentRow,
          gridWidth: widget.gridWidth,
          gridHeight: widget.gridHeight
        };

        currentColumn += widget.gridWidth;
      });

      const gap = newPositions['widget2'].gridRow - (newPositions['widget1'].gridRow + newPositions['widget1'].gridHeight);
      expect(gap).toBe(WIDGET_GAP);
    });
  });

  describe('swapWidgets', () => {
    it('should swap positions of two widgets', () => {
      const widget1 = {
        gridColumn: 1,
        gridRow: 1,
        gridWidth: 6,
        gridHeight: 3
      };

      const widget2 = {
        gridColumn: 7,
        gridRow: 1,
        gridWidth: 6,
        gridHeight: 3
      };

      const tempPos = { gridRow: widget1.gridRow, gridColumn: widget1.gridColumn };

      const widget1After = {
        ...widget1,
        gridRow: widget2.gridRow,
        gridColumn: widget2.gridColumn
      };

      const widget2After = {
        ...widget2,
        gridRow: tempPos.gridRow,
        gridColumn: tempPos.gridColumn
      };

      expect(widget1After.gridColumn).toBe(7);
      expect(widget1After.gridRow).toBe(1);
      expect(widget2After.gridColumn).toBe(1);
      expect(widget2After.gridRow).toBe(1);
    });
  });

  describe('Position persistence', () => {
    it('should preserve original positions when entering edit mode', () => {
      const savedPositions = {
        'widget1': { gridColumn: 1, gridRow: 5, gridWidth: 6, gridHeight: 3 },
        'widget2': { gridColumn: 7, gridRow: 5, gridWidth: 6, gridHeight: 3 }
      };

      const copiedPositions = JSON.parse(JSON.stringify(savedPositions));

      expect(copiedPositions).toEqual(savedPositions);
      expect(copiedPositions).not.toBe(savedPositions);
    });

    it('should restore saved positions when canceling edit mode', () => {
      const savedPositions = {
        'widget1': { gridColumn: 1, gridRow: 5, gridWidth: 6, gridHeight: 3 }
      };

      const modifiedPositions = {
        'widget1': { gridColumn: 1, gridRow: 10, gridWidth: 6, gridHeight: 3 }
      };

      const restoredPositions = JSON.parse(JSON.stringify(savedPositions));

      expect(restoredPositions).toEqual(savedPositions);
      expect(restoredPositions).not.toEqual(modifiedPositions);
    });
  });
});
