// ==========================================================================
//
//  Author:   jsandoe
//
//  Copyright (c) 2016 by The Concord Consortium, Inc. All rights reserved.
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================
//
// This file borrows significantly from the Slickgrid plugin,
// slick.rowselectionmodel.js. It implements CODAP-specific adjustments to this
// plugin to integrate CODAP and Slickgrid selection models.
//
/* global Slick */
DG.CaseTableRowSelectionModel = function (options) {
  var _grid;
  var _caseTableAdapter;
  var _ranges = [];
  var _self = this;
  var _handler = new Slick.EventHandler();
  var _inHandler;
  var _options;
  var _inDrag = false;  // eslint-disable-line no-unused-vars
  var _dragStartRow;
  var _dragStartY = null;
  var _dragStartClientY = null;

  var _defaults = {
    selectActiveRow: true
  };

  function init(grid) {
    _options = $.extend(true, {}, _defaults, options);
    _caseTableAdapter = _options.caseTableAdapter;
    _grid = grid;
    // _handler.subscribe(_grid.onActiveCellChanged,
    //     wrapHandler(handleActiveCellChange));
    _handler.subscribe(_grid.onKeyDown,
        wrapHandler(handleKeyDown));
    _handler.subscribe(_grid.onClick,
        wrapHandler(handleClick));
    _handler.subscribe(_grid.onDragInit,
        wrapHandler(handleDragInit));
    _handler.subscribe(_grid.onDragStart,
        wrapHandler(handleDragStart));
    _handler.subscribe(_grid.onDrag,
        wrapHandler(handleDrag));
    _handler.subscribe(_grid.onDragEnd,
        wrapHandler(handleDragEnd));
  }

  function destroy() {
    _handler.unsubscribeAll();
  }

  function notifyContextOfSelectionChange(rows) {
    SC.run(function () {
      _caseTableAdapter.selectRowsInList(rows);
    });
  }

  function wrapHandler(handler) {
    return function () {
        var result;
        if (!_inHandler) {
          _inHandler = true;
          result = handler.apply(this, arguments);
          _inHandler = false;
          return result;
        }
    };
  }

  function rangesToRows(ranges) {
    var rows = [];
    for (var i = 0; i < ranges.length; i++) {
      for (var j = ranges[i].fromRow; j <= ranges[i].toRow; j++) {
        rows.push(j);
      }
    }
    return rows;
  }

  function rowsToRanges(rows) {
    var ranges = [];
    var lastCell = _grid.getColumns().length - 1;
    for (var i = 0; i < rows.length; i++) {
      ranges.push(new Slick.Range(rows[i], 0, rows[i], lastCell));
    }
    return ranges;
  }

  function getRowsRange(from, to) { // jshint ignore:line
    var i, rows = [];
    for (i = from; i <= to; i++) {
      rows.push(i);
    }
    for (i = to; i < from; i++) {
      rows.push(i);
    }
    return rows;
  }

  function getSelectedRows() {
    return rangesToRows(_ranges);
  }

  function setSelectedRows(rows) {
    setSelectedRanges(rowsToRanges(rows));
  }

  function setSelectedRanges(ranges) {
    _ranges = ranges;
    _self.onSelectedRangesChanged.notify(_ranges);
  }

  function getSelectedRanges() {
    return _ranges;
  }

  // function handleActiveCellChange(e, data) {
  //   var selectedRows = getSelectedRows();
  //
  //   if (_options.selectActiveRow
  //       && data.row != null
  //       && (selectedRows.indexOf(data.row) < 0)) {
  //     // notifyContextOfSelectionChange([data.row]);
  //   }
  // }

  function handleKeyDown(e) {
    var activeRow = _grid.getActiveCell();

    var kUpArrowKeyCode = 38;
    var kDownArrowKeyCode = 40;

    // handle shift-upArrow and shift-downArrow
    if (activeRow && e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey &&
        (e.which === kUpArrowKeyCode || e.which === kDownArrowKeyCode)) {
      var selectedRows = getSelectedRows();
      selectedRows.sort(function (x, y) {
        return x - y;
      });

      if (!selectedRows.length) {
        selectedRows = [activeRow.row];
      }

      var top = selectedRows[0];
      var bottom = selectedRows[selectedRows.length - 1];
      var active;

      if (e.which === kDownArrowKeyCode) {
        active = activeRow.row < bottom || top === bottom ? ++bottom : ++top;
      } else {
        active = activeRow.row < bottom ? --bottom : --top;
      }

      if (active >= 0 && active < _grid.getDataLength()) {
        _grid.scrollRowIntoView(active);
        notifyContextOfSelectionChange(getRowsRange(top, bottom));
      }

      e.preventDefault();
      e.stopPropagation();
    }
  }

  function handleDragInit(e) {
    _inDrag = true;
    e.stopImmediatePropagation();
  }

  function handleDragStart(e) {
    var activeCell = _grid.getCellFromEvent(e);
    var activeCellBox = _grid.getCellNodeBox(activeCell.row, activeCell.cell);
    // We prepare for computing future drag offsets by capturing the current
    // row, its reported vertical coordinate and the 'client' coordinate.
    // These are needed to compute the current vertical position in the grid's
    // coordinate system.
    _dragStartRow = activeCell && activeCell.row;
    _dragStartY = (activeCellBox.top + activeCellBox.bottom) / 2;
    _dragStartClientY = e.clientY;

    var selection = activeCell && [activeCell.row];

    if (selection) {
      notifyContextOfSelectionChange(selection);
    }

    e.stopImmediatePropagation();
  }

  function handleDrag(e) {
    // Compute the active cell from the pixel offset from the starting position
    // Cannot use the target to compute the offset since, on mobile, the target
    // never varies from the original target of the drag start.
    var yOffset = _dragStartY + (e.clientY - _dragStartClientY);
    var activeCell = _grid.getCellFromPoint(0, yOffset);
    var selection;
    var ix, start, end;

    if (activeCell && (_dragStartRow !== null) && (_dragStartRow !== undefined)) {
      selection = [];
      start = Math.min(_dragStartRow, activeCell.row);
      end = Math.max(_dragStartRow, activeCell.row);
      for (ix = start; ix <= end; ix += 1) {
        selection.push(ix);
      }
      notifyContextOfSelectionChange(selection);
    }

    e.stopImmediatePropagation();
  }

  function handleDragEnd(e) {
    e.stopImmediatePropagation();
    _inDrag = false;
    _dragStartRow = undefined;
    _dragStartY = null;
    _dragStartClientY = null;
  }

  function handleClick(e) { // jshint ignore:line
    var cell = _grid.getCellFromEvent(e);
    if (!cell) return false;
    if (!_grid.canCellBeActive(cell.row, cell.cell) &&
          !_caseTableAdapter.isCellRowSelectable(cell.row, cell.cell)) {
      return false;
    }

    var selection = rangesToRows(_ranges);
    var idx = $.inArray(cell.row, selection);

    if (!e.ctrlKey && !e.shiftKey && !e.metaKey) {
      //   selection = [cell.row];
      //   notifyContextOfSelectionChange(selection);
      return false;
    }
    else if (_grid.getOptions().multiSelect) {
      if (idx === -1 && (e.ctrlKey || e.metaKey)) {
        selection.push(cell.row);
        _grid.setActiveCell(cell.row, cell.cell);
      } else if (idx !== -1 && (e.ctrlKey || e.metaKey)) {
        selection = $.grep(selection, function (o, i) {
          return (o !== cell.row);
        });
        _grid.setActiveCell(cell.row, cell.cell);
      } else if (selection.length && e.shiftKey) {
        selection.sort(function (a, b) {return a-b;});
        var first = selection[0];
        var last = selection[selection.length - 1];
        var from = Math.min(cell.row, first);
        var to = Math.max(cell.row, last);
        selection = [];
        for (var i = from; i <= to; i++) {
          selection.push(i);
        }
        _grid.setActiveCell(cell.row, cell.cell);
      }
    }

    notifyContextOfSelectionChange(selection);
    e.stopImmediatePropagation();

    return true;
  }

  $.extend(this, {
    "getSelectedRows": getSelectedRows,
    "setSelectedRows": setSelectedRows,

    "getSelectedRanges": getSelectedRanges,
    "setSelectedRanges": setSelectedRanges,

    "init": init,
    "destroy": destroy,

    "onSelectedRangesChanged": new Slick.Event()
  });
};
