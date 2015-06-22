/*
 * ng-ngrid
 * https://github.com/nikhilogic/ngNGrid

 * Version: 1.0
 * License: MIT
 */
angular.module('ngNgrid', ['ui.bootstrap','ngAnimate'])
.directive('ngNgrid', function ($filter, $window, $timeout) {

    function link(scope, element, attrs) {
        scope.pageSizeOptions = [10, 15, 20, 50, 100, 500, 1000];
        scope.gridCurrentPage = 1;
        scope.gridChildrenSortOrder = false;
        scope.gridChildrenSortColumn = '';        
        scope.filterSelectionList = [];
        scope.distinctColValues = [];
        scope.showSettings = true;
        /*
         * Grid scrolling
         * Sets the scroll area as per the stretch bottom offset or fixed height defined 
         */
        scope.setGridTableStyle = function () {
            var topPosition = document.getElementById('ngGridToolbar').getBoundingClientRect().bottom;
            var bottomPosition = 0;
            if (scope.gridHeightStretchBottomOffset != null) {
                bottomPosition = scope.gridHeightStretchBottomOffset;
            }
            else {
                bottomPosition = window.innerHeight - scope.gridHeightFixed - document.getElementById('ngGridToolbar').getBoundingClientRect().top;
            }
            return { top: topPosition + 'px', bottom: bottomPosition + 'px' };
        };

        /*
         * Grid paging
         * Calculates the total number of pages to set in the pagination control
         */
        scope.gridTotalPages = function () {
            return Math.ceil(scope.rows.length / scope.gridPageSize);
        }

        /*
         * Grid Sorting
         * Toggles the sort on user interaction
         */
        scope.changeSort = function (sortCol) {
            scope.gridSortOrder = !scope.gridSortOrder;
            scope.gridSortColumn = sortCol.Name;
        }

        /*
         * Grid Sorting
         * Toggle the sort on the child tables
         */
        scope.changeChildSort = function (sortCol) {
            scope.gridChildrenSortOrder = !scope.gridChildrenSortOrder;
            scope.gridChildrenSortColumn = sortCol.Name;
        }

        /*
         * Grid Sorting
         * Checks if the column is sorted to render the glyph icon indicators
         */
        scope.isSorted = function (sortCol) {
            return (scope.gridSortColumn == sortCol.Name);
        }

        /*
         * Grid Sorting
         * Checks if the child column is sorted to render the glyph icon indicators
         */
        scope.isChildSorted = function (sortCol) {
            return (scope.gridChildrenSortColumn == sortCol.Name);
        }


        /*
         * Grid Row function
         * Gets the value of the property in an object "O" from a specified string  in "A.B.C" format in O["A"]["B"]["C"] 
         */
        scope.getValueFromPropertyString = function (targetObject, propString) {
            var objValue = null;
            if (propString != null) {
                var arrSplitSortProp = propString.split('.');
                for (var i = 0; i < arrSplitSortProp.length; i++) {
                    if (i == 0) {
                        objValue = targetObject[arrSplitSortProp[i]];
                    }
                    else if (objValue == null) {
                        break;
                    }
                    else {
                        objValue = objValue[arrSplitSortProp[i]];
                    }
                }
            }
            return objValue;
        }

        scope.getChildRows = function (row, childColName) {
            return scope.getValueFromPropertyString(row, childColName);
        }

        scope.childRowsCount = function (row) {
            var childRecCount = 0;
            for (var i = 0; i < scope.childPropertynames.length; i++) {
                var tempChildRows = scope.getValueFromPropertyString(row, scope.childPropertynames[i]);
                childRecCount += tempChildRows ? tempChildRows.length : 0;
            }
            return childRecCount;
        }


        scope.getColValue = function (col, row) {
            return scope.getValueFromPropertyString(row, col.Name);
        }

        scope.setColValue = function (col, row, value) {

            if (col.Name != null) {
                var arrSplitSortProp = col.Name.split('.');
                var arrayLen = arrSplitSortProp.length;

                if (arrayLen == 1) {
                    row[arrSplitSortProp[0]] = value;
                }
                else {
                    var tempObj = null;
                    for (var i = 0; i < arrayLen; i++) {
                        if (i == 0) {
                            tempObj = row[arrSplitSortProp[i]];
                        }
                        else if (tempObj == null) {
                            break;
                        }
                        else if (i == arrayLen - 1) {
                            tempObj[arrSplitSortProp[i]] = value;
                        }
                        else {
                            tempObj = tempObj[arrSplitSortProp[i]];
                        }
                    }
                }
            }
        }

        scope.distinctChildColValues = function (col, row) {
            var distinctValues = [];
            for (i = 0, len = row[scope.childPropertynames].length ; i < len; i++) {
                var colValue = scope.getColValue(col, row[scope.childPropertynames][i]);
                if (colValue != null) {
                    if (distinctValues.indexOf(colValue) == -1) {
                        distinctValues.push(colValue);
                    }
                }
            }
            distinctValues.sort();
            return distinctValues;
        };


        /*
         * Grid Filters
         * Gets the distinct values in the rows for that column. The distinct Value is an object with three properties :
         *  1. DistinctValue -  which is the actual value of the object property in the row
         *  2. DistinctCount - count of the distinct value (grouping)
         *  3. DisplayValue -  How the value is displayed in the filter
         */
        scope.generateDistinctColValues = function (col, rowSet) {
            var distinctValues = [];
            //Iterate over the rows for that column to group distinct values
            for (i = 0, len = rowSet.length ; i < len; i++) {
                var colValue = scope.getColValue(col, rowSet[i]);
                if (colValue != null) {
                    var matchFound = false;
                    //look for colValue in DistinctValue
                    for (var j = 0; j < distinctValues.length; j++) {
                        if (distinctValues[j].DistinctValue == colValue) {
                            //Value already exists; so increment the counter in the distinctValues array for that value.
                            matchFound = true;
                            distinctValues[j].DistinctCount += 1;
                            break;
                        }
                    }
                    if (!matchFound) {
                        //new value found add to the distinctValues array
                        var colDisplayValue = col.FilterTextFn ? col.FilterTextFn({ DistinctValue: colValue, DistinctCount: -1 }) : colValue;
                        if (col.ColumnType == 'ngNGridDate') {
                            colDisplayValue = col.FilterDateFormatFn ? $filter('date')(colDisplayValue, col.FilterDateFormatFn(null)) : $filter('date')(colDisplayValue);
                        }

                        distinctValues.push({ DistinctValue: colValue, DistinctCount: 1, DisplayValue: colDisplayValue });
                    }
                }
            }

            distinctValues.sort(function (p, n) {
                if (p.DistinctValue < n.DistinctValue) { return -1; }
                if (p.DistinctValue > n.DistinctValue) { return 1; }
                return 0;
            });
            return distinctValues;
        };



        /*
        * Grid Filters
        * Sets the distinct values for the list in the column on expanding the filter menu
        */
        scope.setDistinctColValuesFiltered = function (col) {
            var filteredRows = scope.gridFilteredRows;
            //Populate distinct values from the entire rows if this is the first filter applied or no other filter applied            
            if (filteredRows.length == scope.rows.length || (scope.columnFilters[col.Name] != null && scope.columnFilters[col.Name].IsFirstFilter)) {
                scope.distinctColValues[col.Name] = scope.generateDistinctColValues(col, scope.rows);
            }
            else if (!scope.isColFilterApplied(col.Name)) {
                // populate the filter list only when the filter does not already exist for the rows and we are not the first filtered column                
                scope.distinctColValues[col.Name] = scope.generateDistinctColValues(col, filteredRows);
            }
        }

        /*
        * Grid Filters
        * Toggle column filters
        */
        scope.toggleColFilters = function (col) {
            //if Filter is already applied clear the filters
            if (scope.isColFilterApplied(col.Name)) {
                //clear all filters
                delete scope.columnFilters[col.Name];
                scope.gridFiltersChanged({ filterColumnName: col.Name, filters: [''], isAdded: false });
            }
            else {
                var filtersAdded = [];
                //apply the filters for all values which are filtered in drop down list                
                for (var i = 0; i < col.DropdownFilteredObjects.length; i++) {
                    scope.addColumnFilters(col.Name, [col.DropdownFilteredObjects[i].DistinctValue]);
                    filtersAdded.push(col.DropdownFilteredObjects[i].DistinctValue);
                }
                //notify parent control that filters have changed
                scope.gridFiltersChanged({ filterColumnName: col.Name, filters: filtersAdded, isAdded: true });
            }
        }
       
        /*
         * Grid Filters
         * Sets or removes the filters for columns
         */
        scope.addColumnFilters = function (colName, filters) {
            if (filters != null) {
                var filtersAdded = [];
                var filtersRemoved = [];

                for (var i = 0; i < filters.length; i++) {

                    var filterString = filters[i];

                    filterString = filterString.toString().trim().toLowerCase();
                    //Is this the first filter?
                    var firstFilter = false;
                    if (Object.keys(scope.columnFilters).length <= 0) {
                        firstFilter = true;
                    }
                    //initialise the ColumnFilter object
                    if (scope.columnFilters[colName] == null) {
                        scope.columnFilters[colName] = [];
                    }
                    //Does the filter exists -if it exists toggle it . if it dosent then add it               
                    var posFilter = scope.columnFilters[colName].indexOf(filterString);
                    if (posFilter == -1) {

                        //item  not found - add it
                        scope.columnFilters[colName].push(filterString);
                        //Is this column already the FirstFilter?
                        if (!scope.columnFilters[colName].IsFirstFilter) {
                            scope.columnFilters[colName].IsFirstFilter = firstFilter;
                        }
                        filtersAdded.push(filterString);
                    }
                    else {

                        //item exists toggle - remove it
                        scope.columnFilters[colName].splice(posFilter, 1);
                        if (scope.columnFilters[colName].length == 0) {
                            delete scope.columnFilters[colName];
                            //set the first filter to the next immediate column
                            for (var cFilter in scope.columnFilters) {
                                if (scope.isColFilterApplied(cFilter)) {
                                    scope.columnFilters[cFilter].IsFirstFilter = true;
                                    break;
                                }
                            }
                        }
                        filtersRemoved.push(filterString);
                    }
                }

                if (filtersAdded.length > 0) {
                    //notify hosting control that filters have changed
                    scope.gridFiltersChanged({ filterColumnName: colName, filters: filtersAdded, isAdded: true });
                }
                if (filtersRemoved.length > 0) {
                    //notify hosting control that filters have changed
                    scope.gridFiltersChanged({ filterColumnName: colName, filters: filtersRemoved, isAdded: false });
                }
            }
        }

        scope.isColFilterApplied = function (colName) {
            return (scope.columnFilters[colName] != null);
        }

        scope.isColFiltered = function (colName, filterString) {
            if (scope.columnFilters == null || scope.columnFilters == []) return false;
            if (filterString != null) {
                filterString = filterString.toString().toLowerCase();
                if (scope.columnFilters[colName] != null) {
                    return (scope.columnFilters[colName].indexOf(filterString) > -1);
                }
            }
            else {
                return false;
            }
        }

        scope.clearAllFilters = function () {
            scope.columnFilters = [];
            scope.gridFiltersChanged({ filterColumnName: '', filters: [''], isAdded: false });
        }

        scope.anyFiltersExist = function () {
            if (scope.columnFilters == null || scope.columnFilters == [] || Object.keys(scope.columnFilters) <= 0) return false;
            for (var prop in scope.columnFilters) {
                if (scope.columnFilters[prop] != null) return true;
            }
            return false;
        }

        scope.getStyle = function () {
            if (scope.gridHeightStretchBottomOffset != null) {
                //stretch to window                
                return { height: window.innerHeight - document.getElementById('ngGridToolbar').getBoundingClientRect().top - scope.gridHeightStretchBottomOffset + 'px', width: 100 + '%' };
            }
            else {
                return { height: scope.gridHeightFixed + 'px', width: 100 + '%' };
            }
        }

        scope.canShowRecord = function (row) {
            if (scope.columnFilters != null) {
                if (Object.keys(scope.columnFilters).length > 0) {
                    var rowMatched = true;
                    for (var prop in scope.columnFilters) {
                        var filtersForCol = scope.columnFilters[prop];
                        var colMatched = false;
                        for (var j = 0; j < filtersForCol.length; j++) {

                            var field = null;
                            if (prop.indexOf('.') <= -1) {

                                field = row[prop];
                            }
                            else {
                                var splitProp = prop.split('.');
                                field = row[splitProp[0]][splitProp[1]];
                            }
                            field = field.toString();
                            if (field.toLowerCase() == filtersForCol[j]) {
                                colMatched = true;
                                break;//out of the filter for that column
                            }
                        }
                        rowMatched = rowMatched && colMatched;
                    }
                    return rowMatched;
                }
            }
            return true; //no filters for the row
        }

        scope.allRowsSelected = false;

        scope.toggleRowsSelect = function () {
            for (var i = 0; i < scope.rows.length; i++) {
                scope.rows[i].isNgNgridSelected = !scope.allRowsSelected;
            }
            scope.allRowsSelected = !scope.allRowsSelected;
        }


        scope.on_fileUpload = function (element) {
            var cancel = false;
            var rowsToImport = [];
            scope.files = [];
            for (var i = 0; i < element.files.length; i++) {
                var reader = new FileReader();
                reader.readAsText(element.files[i]);
                reader.onload = function (e) {
                    var arrRows = angular.fromJson(reader.result);
                    var colDates = [];
                    //do we have any date columns?
                    for (var c = 0; c < scope.columnDefinitions.length; c++) {
                        if (scope.columnDefinitions[c].Type == 'Date') {
                            colDates.push(scope.columnDefinitions[c].Name);
                        }
                    }
                    for (var j = 0; j < arrRows.length; j++) {
                        //check for any date objects
                        for (var c = 0; c < colDates.length; c++) {
                            if (arrRows[j][colDates[c]] != null) {
                                arrRows[j][colDates[c]] = new Date(arrRows[j][colDates[c]]);
                            }
                        }
                        rowsToImport.push(arrRows[j]);                        
                    }
                    //allow hosting control to override it
                    var importObj = { Rows: rowsToImport, CancelEvent: cancel };
                    scope.onDataImport({ ngNgridImportObject: importObj });
                    if (!importObj.CancelEvent) {
                        for (var k = 0; k < rowsToImport.length; k++) {
                            scope.rows.unshift(rowsToImport[k]);
                        }
                        scope.$apply();
                    }
                }
            }
        };


        scope.importFromJson = function () {
            var fileUpload = document.getElementById("fileUploadJson");
            fileUpload.click();
        }

        scope.isAnyRowSelected = function () {
            for (var i = 0; i < scope.rows.length; i++) {
                if (scope.rows[i].isNgNgridSelected) {
                    return true;
                }
            }
            return false;
        }
        scope.exportSelectedToJson = function () {
            var cancel = false;
            var selectedRows = [];
            for (var i = 0; i < scope.rows.length; i++) {
                if (scope.rows[i].isNgNgridSelected) {
                    selectedRows.push(scope.rows[i]);
                }
            }
            var exportObj = { Rows: selectedRows, CancelEvent: cancel };
            scope.onDataExport({ ngNgridExportObject: exportObj });
            if (!exportObj.CancelEvent) {
                var blobObject = new Blob([angular.toJson(selectedRows)]);
                window.navigator.msSaveBlob(blobObject, 'ngNGridExport.json'); // The user only has the option of clicking the Save button.            
            }
        }

        scope.ondropDownToggle = function (c, e) {
            if (c.isNgNgridDropdownOpen) {
                scope.setDistinctColValuesFiltered(c);
                $timeout(function () { document.getElementById(e).focus(); }, 100);
            }
        }

        scope.dropdownFilterKeyPress = function (event, c) {
            if (event.keyCode == 13) {
                scope.toggleColFilters(c);
                c.isNgNgridDropdownOpen = false;
                //sotpping enter from being propagated to parent dom elements.
                event.preventDefault();
            }
        }

        scope.updateDateFilter = function (colName, StartDate, EndDate) {
            if (StartDate != null && EndDate != null) {
                EndDate.setHours(23);
                EndDate.setMinutes(59);
                EndDate.setSeconds(59)
                scope.updateRangeFilter(colName, StartDate, EndDate, false);
            }
        }

        scope.updateNumberFilter = function (colName, StartNumber, EndNumber) {
            scope.updateRangeFilter(colName, StartNumber, EndNumber, true);
        }

        scope.updateRangeFilter = function (colName, StartRange, EndRange, useDisplayValue) {
            if (StartRange != null && EndRange != null) {
                var distinctValues = scope.distinctColValues[colName];
                var colFilters = [];
                for (var i = 0; i < distinctValues.length; i++) {
                    var propToAdd = useDisplayValue ? 'DisplayValue' : 'DistinctValue';
                    if (distinctValues[i][propToAdd] >= StartRange && distinctValues[i][propToAdd] <= EndRange) {
                        colFilters.push(distinctValues[i].DistinctValue);
                    }
                }
                if (colFilters.length > 0) {
                    scope.addColumnFilters(colName, colFilters);
                }
            }
        }

    }

    return {
        restrict: 'E',
        scope: {
            columnDefinitions: '=',
            childColumndefinitions: '=',
            childPropertynames: '=',
            rowFooterdefinitions: '=',
            rows: '=',
            rowsLoading: '=',
            rowsLoadingText: '@',
            gridPageSize: '=initialPagesize',
            gridSortColumn: '=initialSortcolumn',
            gridSortOrder: '=initialSortdesc',
            showRowNumbers: '=',
            showRowSelector: '=',
            gridHeightFixed: '=',
            gridHeightStretchBottomOffset: '=',
            gridFiltersChanged: '&',
            onDataImport: '&',
            onDataExport: '&',
            addColumnFilters: '=',
            columnFilters: '=',
            showSettings: '=?'
        },
        templateUrl: 'Templates/NgNgridTemplate.html',
        link: link
    };
})
.filter('ngNgridPageOffset', function () {
    return function (input, start) {
        return input.slice(start);
    };
})
//.run(function ($templateCache) {
//    $templateCache.put('Templates/NgNgridTemplate.html', '');
//});
