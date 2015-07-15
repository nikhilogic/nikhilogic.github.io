/*
 * ng-ngrid
 * https://github.com/nikhilogic/ngNGrid

 * Version: 1.2
 * License: MIT
 */
angular.module('ngNgrid', ['ui.bootstrap', 'ngAnimate'])
.directive('ngNgrid', function ($filter, $window, $timeout) {


    function link(scope, element, attrs) {

        scope.rememberFilters = true;

        //helper functions for persisting information
        function setStorage(key, data) {
            if (scope.rememberFilters) {
                if (typeof data == 'object') {
                    //logDebug('SetStorage()  Key:' + key + '  Value(Original): ' + data);
                    data = JSON.stringify(data);
                }
                //logDebug('SetStorage()  Key:' + key + '  Value(Stringified): ' + data);
                sessionStorage.setItem(key, data);
            }
        }

        function getStorageOrDefault(key, defaultData) {
            if (scope.rememberFilters) {
                var savedData = sessionStorage.getItem(key);
                //logDebug('GetStorage()  Key:' + key + '  Value(Stringified): ' + savedData);
                if (savedData == null) {
                    setStorage(key, defaultData);
                    //logDebug('GetStorage()  Key:' + key + '  Value(Default): ' + defaultData);
                    return defaultData;
                }
                else {

                    try {
                        savedData = JSON.parse(savedData)
                    }
                    catch (e) {
                        //not a json object return simple type
                    }
                    //logDebug('GetStorage()  Key:' + key + '  Value(Original): ' + savedData);
                    return savedData;
                }
            }
        }

        function removeStorage(key) {
            if (scope.rememberFilters) {
                sessionStorage.removeItem(key);
            }
        }

        scope.pageSizeOptions = [10, 15, 20, 50, 100, 500, 1000];
        scope.gridCurrentPage = 1;
        scope.gridChildrenSortOrder = false;
        scope.gridChildrenSortColumn = '';
        scope.filterSelectionList = [];
        scope.distinctColValues = [];
        scope.showSettings = false;
        scope.columnFilters = getStorageOrDefault(window.location.href + '/ngNGridColFilters', {});
        scope.gridPageSize = 15;
        scope.showRowNumbers = false;
        scope.showRowSelector = false;
        //scope.gridHeightStretchBottomOffset = 0;
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

        scope.totalPages = function (rowLength, pageSize) {
            return Math.ceil(rowLength / pageSize);
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
                scope.gridFiltersChanged(col.Name, [''], false);

            }
            else {
                var filtersAdded = [];
                //apply the filters for all values which are filtered in drop down list                
                for (var i = 0; i < col.ngNgridDropdownFilteredObjects.length; i++) {
                    scope.addColumnFilters(col.Name, [col.ngNgridDropdownFilteredObjects[i].DistinctValue]);
                    filtersAdded.push(col.ngNgridDropdownFilteredObjects[i].DistinctValue);
                }
                //notify parent control that filters have changed                
                scope.gridFiltersChanged(col.Name, filtersAdded, true);
            }
        }

        /*
         * Grid Filters
         * Sets or removes the filters for columns
         */
        scope.addColumnFilters = function (colName, filters, ignoreIfExists) {
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
                    else if (!ignoreIfExists) {

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
                    scope.gridFiltersChanged(colName, filtersAdded, true);
                }
                if (filtersRemoved.length > 0) {
                    //notify hosting control that filters have changed
                    scope.gridFiltersChanged(colName, filtersRemoved, false);
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
                    var cmp = (scope.columnFilters[colName].indexOf(filterString) > -1);
                    //logDebug('org:' + scope.columnFilters[colName] + ' filter:' + filterString + ' cmp:'+ cmp);

                    return cmp;
                }
            }
            else {
                return false;
            }
        }

        scope.clearAllFilters = function () {
            scope.columnFilters = [];
            scope.gridFiltersChanged('', [''], false);
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

        scope.updateRangeFilter = function (col, StartRange, EndRange) {
            if (StartRange != null && EndRange != null) {

                //for date range set end date to last moment of that day
                if (col.ColumnType == 'ngNGridDate') {
                    EndRange.setHours(23);
                    EndRange.setMinutes(59);
                    EndRange.setSeconds(59);
                }

                var distinctValues = scope.distinctColValues[col.Name];
                var colFilters = [];
                for (var i = 0; i < distinctValues.length; i++) {
                    var objToCompare = null;
                    if (col.ColumnType == 'ngNGridDate') {
                        //cast it to date for comparision
                        objToCompare = dateReviver(distinctValues[i]['DistinctValue']);
                    }
                    else {
                        objToCompare = distinctValues[i]['DisplayValue'];
                    }
                    if (objToCompare >= StartRange && objToCompare <= EndRange) {
                        //logDebug('compare ' + objToCompare + ' Start:' + StartRange + ' End:' + EndRange);
                        colFilters.push(distinctValues[i].DistinctValue);
                    }
                }
                if (colFilters.length > 0) {
                    scope.addColumnFilters(col.Name, colFilters);
                }
            }
        }

        scope.gridFiltersChanged = function (colName, colFilters, colFilterAdded) {
            scope.notifyGridFiltersChanged({ filterColumnName: colName, filters: colFilters, isAdded: colFilterAdded });

            if (colName == '') {
                removeStorage(window.location.href + '/ngNGridColFilters');
            }
            else {
                setStorage(window.location.href + '/ngNGridColFilters', scope.columnFilters);
            }
        }

        /*
         * Customized from  https://msdn.microsoft.com/library/cc836466(v=vs.94).aspx
         * The reviver function is often used to transform JSON representation of International Organization for Standardization (ISO) date strings into
         * Coordinated Universal Time (UTC) format Date objects. This example uses JSON.parse to deserialize an ISO-formatted date string. The dateReviver 
         * function returns Date objects for members that are formatted like ISO date strings.
         */
        function dateReviver(dateString) {
            var a;
            a = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2}(?:\.\d*)?)Z*$/.exec(dateString);
            if (a) {
                return new Date(+a[1], +a[2] - 1, +a[3], +a[4],
                                +a[5], +a[6]);
            }
            return dateString;
        };




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
            gridPageSize: '=?initialPagesize',
            gridSortColumn: '=?initialSortcolumn',
            gridSortOrder: '=?initialSortdesc',
            showRowNumbers: '=?',
            showRowSelector: '=?',
            gridHeightFixed: '=',
            gridHeightStretchBottomOffset: '=?',
            notifyGridFiltersChanged: '&gridFiltersChanged',
            onDataImport: '&',
            onDataExport: '&',
            addColumnFilters: '=?',
            showSettings: '=?',
            rememberFilters: '=?'
        },
        templateUrl: 'Templates/NgNgridTemplate.html',
        link: link
    };
})
