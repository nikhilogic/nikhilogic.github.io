/*
 * ng-ngrid
 * https://github.com/nikhilogic/ngNGrid

 * Version: 1.0
 * License: MIT
 */
angular.module('ngNgrid', ['ui.bootstrap'])
.directive('ngNgrid', function ($filter, $window, $timeout) {

    function link(scope, element, attrs) {
        scope.pageSizeOptions = [10, 15, 20, 50, 100, 500, 1000];
        scope.gridCurrentPage = 1;
        scope.gridChildrenSortOrder = false;
        scope.gridChildrenSortColumn = '';
        scope.customFilter = [];
        scope.customFilter.ColumnFilters = [];
        scope.filterSelectionList = [];
        scope.distinctLists = [];

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
            scope.gridSortColumn = scope.getSortProperty(sortCol);
        }

        /*
         * Grid Sorting
         * Toggle the sort on the child tables
         */
        scope.changeChildSort = function (sortCol) {
            scope.gridChildrenSortOrder = !scope.gridChildrenSortOrder;
            scope.gridChildrenSortColumn = scope.getSortProperty(sortCol);
        }

        /*
         * Grid Sorting
         * Checks if the column is sorted to render the glyph icon indicators
         */
        scope.isSorted = function (sortCol) {
            return (scope.gridSortColumn == scope.getSortProperty(sortCol));
        }

        /*
         * Grid Sorting
         * Checks if the child column is sorted to render the glyph icon indicators
         */
        scope.isChildSorted = function (sortCol) {
            return (scope.gridChildrenSortColumn == scope.getSortProperty(sortCol));
        }

        /*
         * Grid Sorting
         * Gets the sort property set on the column. Default sort property is the column Name property
         */
        scope.getSortProperty = function (col) {
            var colName = null;
            if (col.SortProperty != null) {
                colName = col.Name + '.' + col.SortProperty;
            }
            else {
                colName = col.Name;
            }
            return colName;
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
            var val = null;
            if (row[col.Name] != null) {
                if (col.SortProperty != null) {
                    val = scope.getValueFromPropertyString(row[col.Name], col.SortProperty);
                }
                else {
                    val = row[col.Name];
                }
            }
            return val;
        }

        scope.distinctChildColValues = function (col, row) {
            var distinctValues = [];
            var colName = scope.getSortProperty(col);
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
        scope.distinctColValues = function (col, rowSet) {
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
            var colName = scope.getSortProperty(col);
            var filteredRows = scope.gridFilteredRows;
            //Populate distinct values from the entire rows if this is the first filter applied or no other filter applied            
            if (filteredRows.length == scope.rows.length || (scope.customFilter.ColumnFilters[colName] != null && scope.customFilter.ColumnFilters[colName].IsFirstFilter)) {
                scope.distinctLists[colName] = scope.distinctColValues(col, scope.rows);
            }
            else if (!scope.isColNameFilterApplied(colName)) {
                // populate the filter list only when the filter does not already exist for the rows and we are not the first filtered column                
                scope.distinctLists[colName] = scope.distinctColValues(col, filteredRows);
            }
        }

        /*
        * Grid Filters
        * Toggle column filters
        */
        scope.toggleColFilters = function (col) {
            var colName = scope.getSortProperty(col);
            //if Filter is already applied clear the filters
            if (scope.isColNameFilterApplied(colName)) {
                //clear all filters
                delete scope.customFilter.ColumnFilters[colName];
                scope.gridFiltersChanged({ filterColumnName: colName, filters: [''], isAdded: false });
            }
            else {
                var filtersAdded = [];
                //apply the filters for all values which are filtered in drop down list                
                for (var i = 0; i < col.DropdownFilteredObjects.length; i++) {
                    scope.addColumnFilters(col, [col.DropdownFilteredObjects[i].DistinctValue]);
                    filtersAdded.push(col.DropdownFilteredObjects[i].DistinctValue);
                }
                //notify parent control that filters have changed
                scope.gridFiltersChanged({ filterColumnName: colName, filters: filtersAdded, isAdded: true });
            }
        }


        /*
         * Grid Filters
         * Event for the parent control to set the filters
         */
        scope.$on('ngNGrid_FilterChange', function (event, filterCol, filters) {
            scope.addColumnFilters(filterCol, filters);
        });

        /*
         * Grid Filters
         * Sets or removes the filters for columns
         */
        scope.addColumnFilters = function (col, filters) {
            if (filters != null) {
                var colName = scope.getSortProperty(col);
                var filtersAdded = [];
                var filtersRemoved = [];

                for (var i = 0; i < filters.length; i++) {

                    var filterString = filters[i];

                    filterString = filterString.toString().trim().toLowerCase();
                    //Is this the first filter?
                    var firstFilter = false;
                    if (Object.keys(scope.customFilter.ColumnFilters).length <= 0) {
                        firstFilter = true;
                    }
                    //initialise the ColumnFilter object
                    if (scope.customFilter.ColumnFilters[colName] == null) {
                        scope.customFilter.ColumnFilters[colName] = [];
                    }
                    //Does the filter exists -if it exists toggle it . if it dosent then add it               
                    var posFilter = scope.customFilter.ColumnFilters[colName].indexOf(filterString);
                    if (posFilter == -1) {

                        //item  not found - add it
                        scope.customFilter.ColumnFilters[colName].push(filterString);
                        //Is this column already the FirstFilter?
                        if (!scope.customFilter.ColumnFilters[colName].IsFirstFilter) {
                            scope.customFilter.ColumnFilters[colName].IsFirstFilter = firstFilter;
                        }
                        filtersAdded.push(filterString);
                    }
                    else {

                        //item exists toggle - remove it
                        scope.customFilter.ColumnFilters[colName].splice(posFilter, 1);
                        if (scope.customFilter.ColumnFilters[colName].length == 0) {
                            delete scope.customFilter.ColumnFilters[colName];
                            //set the first filter to the next immediate column
                            for (var cFilter in scope.customFilter.ColumnFilters) {
                                if (scope.isColNameFilterApplied(cFilter)) {
                                    scope.customFilter.ColumnFilters[cFilter].IsFirstFilter = true;
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


        scope.isColFilterApplied = function (col) {
            var colName = scope.getSortProperty(col);
            return scope.isColNameFilterApplied(colName);
        }

        scope.isColNameFilterApplied = function (colName) {
            return (scope.customFilter.ColumnFilters[colName] != null);
        }

        scope.isColFiltered = function (col, filterString) {
            if (scope.customFilter.ColumnFilters == null || scope.customFilter.ColumnFilters == []) return false;
            if (filterString != null) {
                filterString = filterString.toString().toLowerCase();
                var colName = scope.getSortProperty(col);
                if (scope.customFilter.ColumnFilters[colName] != null) {
                    return (scope.customFilter.ColumnFilters[colName].indexOf(filterString) > -1);
                }
            }
            else {
                return false;
            }
        }

        scope.clearAllFilters = function () {
            scope.customFilter.ColumnFilters = [];
            scope.gridFiltersChanged({ filterColumnName: '', filters: [''], isAdded: false });
        }

        scope.anyFiltersExist = function () {
            if (scope.customFilter.ColumnFilters == null || scope.customFilter.ColumnFilters == [] || Object.keys(scope.customFilter.ColumnFilters) <= 0) return false;
            for (var prop in scope.customFilter.ColumnFilters) {
                if (scope.customFilter.ColumnFilters[prop] != null) return true;
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
            if (scope.customFilter != null && scope.customFilter.ColumnFilters != null) {
                if (Object.keys(scope.customFilter.ColumnFilters).length > 0) {
                    var rowMatched = true;
                    for (var prop in scope.customFilter.ColumnFilters) {
                        var filtersForCol = scope.customFilter.ColumnFilters[prop];
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
                        //scope.rows.unshift(arrRows[j]);
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

        scope.updateDateFilter = function (c, StartDate, EndDate) {
            if (StartDate != null && EndDate != null) {
                EndDate.setHours(23);
                EndDate.setMinutes(59);
                EndDate.setSeconds(59)
                scope.updateRangeFilter(c, StartDate, EndDate, false);
            }
        }

        scope.updateNumberFilter = function (c, StartNumber, EndNumber) {
            scope.updateRangeFilter(c, StartNumber, EndNumber, true);
        }

        scope.updateRangeFilter = function (c, StartRange, EndRange, useDisplayValue) {
            if (StartRange != null && EndRange != null) {
                var colName = scope.getSortProperty(c);
                var distinctValues = scope.distinctLists[colName];
                var colFilters = [];
                for (var i = 0; i < distinctValues.length; i++) {
                    var propToAdd = useDisplayValue ? 'DisplayValue' : 'DistinctValue';
                    if (distinctValues[i][propToAdd] >= StartRange && distinctValues[i][propToAdd] <= EndRange) {
                        colFilters.push(distinctValues[i].DistinctValue);
                    }
                }
                if (colFilters.length > 0) {
                    scope.addColumnFilters(c, colFilters);
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
            onDataExport: '&'
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
/*.run(function ($templateCache) {
    $templateCache.put('Templates/NgNgridTemplate.html', '<div ng-style="getStyle()"> <nav id="ngGridToolbar" class="navbar-form navbar-default navbar-static-top" role="navigation"> <div class="container-fluid"> <div class="navbar-left"> <span class="btn-toolbar"> <span class="btn-group"> <label class="btn btn-default" btn-checkbox ng-model="hideSettings" data-toggle="tooltip" data-placement="right" title="Show/Hide Settings"> <span class="glyphicon glyphicon-cog"></span> <span ng-class="hideSettings?\'ngngrid-caret-left\':\'ngngrid-caret-right\'"></span> </label> </span> <span class="btn-group" ng-show="hideSettings"> <label class="btn btn-default" btn-checkbox ng-model="showRowNumbers" data-toggle="tooltip" data-placement="right" title="Show/Hide Row Numbers"> <span class="glyphicon" ng-class="showRowNumbers?\'glyphicon-check\':\'glyphicon-unchecked\'"></span> Row # </label> <label class="btn btn-default" btn-checkbox ng-model="showRowSelector" data-toggle="tooltip" data-placement="right" title="Show/Hide Row Selector"> <span class="glyphicon" ng-class="showRowSelector?\'glyphicon-check\':\'glyphicon-unchecked\'"></span> Selectable Rows </label> <label class="btn btn-default" btn-checkbox ng-model="showChildrenCount" data-toggle="tooltip" data-placement="right" title="Show/Hide Children Count"> <span class="glyphicon" ng-class="showChildrenCount?\'glyphicon-check\':\'glyphicon-unchecked\'"></span> Child Record Count </label> </span> <span class="btn-group" ng-show="hideSettings"> <label class="btn btn-danger" ng-click="clearAllFilters()" ng-disabled="!anyFiltersExist()" data-toggle="tooltip" data-placement="right" title="Clear All Filters"> Clear all <span class="glyphicon glyphicon-filter"></span> </label> </span> <span class="btn-group" ng-show="hideSettings"> <input id="fileUploadJson" class="form-control btn btn-default" type="file" accept=".json" onchange="angular.element(this).scope().on_fileUpload(this)" style="display:none" /> <label class="btn btn-primary" ng-click="importFromJson()" data-toggle="tooltip" data-placement="right" title="Import grid rows from json file"> Import <span class="glyphicon glyphicon-import"></span> </label> <label class="btn btn-primary" ng-disabled="!isAnyRowSelected()" ng-click="exportSelectedToJson()" data-toggle="tooltip" data-placement="right" title="Export selected rows to json file"> Export Selected <span class="glyphicon glyphicon-export"></span> </label> </span> </span> </div> <div class="navbar-right"> <span class="btn-group"> <label class="btn" onmouseover="" style="cursor:default"><b>{{gridCurrentPage}}-{{gridTotalPages()}}</b> of <b>{{rows.length}}</b></label> <span> <pagination class="pagination" onmouseover="" style="cursor: pointer;margin:0" boundary-links="true" total-items="rows.length" ng-model="gridCurrentPage" items-per-page="gridPageSize" previous-text="&lsaquo;" next-text="&rsaquo;" first-text="&laquo;" last-text="&raquo;" max-size="5" rotate=""></pagination> </span> </span> <span class="input-group" style="margin-top:-6px" data-toggle="tooltip" data-placement="right" title="Records per Page"> <span class="input-group-addon"> <span class=" glyphicon glyphicon-th-list"></span> </span> <select class="form-control" ng-model="gridPageSize" ng-options="number for number in pageSizeOptions"></select> </span> </div> </div> </nav> <div class="ngngrid-scroll" ng-style="setGridTableStyle()"> <table id="ngGridTable" class="table table-condensed table-bordered table-striped"> <tr> <th ng-if="childColumndefinitions.length > 0" class="bg-primary"></th> <th ng-show="showRowNumbers" class="bg-primary">#</th> <th ng-show="showRowSelector" ng-click="toggleRowsSelect()" style="cursor:pointer" data-toggle="tooltip" title="Select/Unselect All" class="bg-primary"> <span class="glyphicon" ng-class="allRowsSelected ? \'glyphicon-check\': \'glyphicon-unchecked\'"></span> </th> <th ng-repeat="c in columnDefinitions" ng-hide="c.isNgNgridColumnHide" class="bg-primary"> <span ng-click="changeSort(c)" style="cursor:pointer"> <u>{{c.DisplayName}}</u> <span ng-show="isSorted(c)" class="glyphicon" ng-class="gridSortOrder?\'glyphicon-chevron-down\':\'glyphicon-chevron-up\'"></span> </span> </th> </tr> <tr> <th ng-if="childColumndefinitions.length > 0"></th> <th ng-show="showRowNumbers"></th> <th ng-show="showRowSelector"></th> <th ng-repeat="c in columnDefinitions" ng-hide="c.isNgNgridColumnHide"> <div ng-hide="c.DisableFilter" class="input-group input-group-sm dropdown" dropdown auto-close="outsideClick" is-open="c.isNgNgridDropdownOpen" on-toggle="ondropDownToggle(c,\'ngNgridDropdownFilter\' + $index)"> <input type="text" class="form-control" ng-model="dropDownFilterInput" ng-init="dropDownFilterInput=\'\'" ng-focus="c.isNgNgridDropdownOpen=true" id="ngNgridDropdownFilter{{$index}}" ng-keypress="dropdownFilterKeyPress($event,c)" /> <span class="input-group-btn"> <button type="button" dropdown-toggle class="btn dropdown-toggle" ng-class="isColFilterApplied(c) ? \'btn-primary\':\'btn-default\'"> <span class="glyphicon glyphicon-filter"></span> </button> </span> <ul class="dropdown-menu" ng-class="$index==columnDefinitions.length-1 ? \'dropdown-menu-right\' :\'\'" role="menu" style="overflow-y:auto;max-height:500px;width:auto;overflow-x:auto"> <li class="ngngrid-dropdown"><small class="text-muted">*Type & hit Enter to apply filters</small></li> <li class="divider"></li> <li class="ngngrid-dropdown"> <span class="input-group input-group-sm" style="cursor: pointer" ng-click="toggleColFilters(c);$event.stopPropagation()"> <span class="glyphicon" ng-class="isColFilterApplied(c)?\'glyphicon-check\':\'glyphicon-unchecked\'" ></span> <span>Select/Unselect All</span> </span> </li> <li ng-if="c.ColumnType==\'ngNGridDate\' || c.ColumnType==\'ngNGridNumber\'" class="divider"></li> <span ng-if="c.ColumnType==\'ngNGridDate\'"> <span class="input-group"> <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span> <input type="date" class="form-control" datepicker-popup ng-model="ngNgridStartDate" is-open="datepickerstartopen" date-disabled="false" ng-required="true" close-text="Close" datepicker-append-to-body="true" ng-click="datepickerstartopen=true" placeholder="From" ng-change="updateDateFilter(c,ngNgridStartDate,ngNgridEndDate)" /> </span> <div></div> <span class="input-group"> <span class="input-group-addon"> <span class="glyphicon glyphicon-calendar"></span> </span> <input type="date" class="form-control" datepicker-popup ng-model="ngNgridEndDate" is-open="datepickerendopen" date-disabled="false" ng-required="true" close-text="Close" datepicker-append-to-body="true" ng-click="datepickerendopen=true" placeholder="To" ng-change="updateDateFilter(c,ngNgridStartDate,ngNgridEndDate)" /> </span> </span> <span ng-if="c.ColumnType==\'ngNGridNumber\'"> <span class="input-group"> <span class="input-group-addon"> <span class="glyphicon glyphicon-step-backward"></span> </span> <input type="number" class="form-control" ng-model="ngNgridStartNumber" ng-required="true" placeholder="From" ng-change="updateNumberFilter(c,ngNgridStartNumber,ngNgridEndNumber,true)" /> </span> <div></div> <span class="input-group"> <span class="input-group-addon"> <span class="glyphicon glyphicon-step-forward"></span> </span> <input type="number" class="form-control" ng-model="ngNgridEndNumber" ng-required="true" placeholder="To" ng-change="updateNumberFilter(c,ngNgridStartNumber,ngNgridEndNumber,true)" /> </span> </span>  <li class="divider"></li> <li ng-repeat="distinctObj in (c.DropdownFilteredObjects = (distinctLists[getSortProperty(c)] | filter:{DisplayValue:dropDownFilterInput}:false)) | orderBy:false" class="ngngrid-dropdown" ng-click="addColumnFilters(c,[distinctObj.DistinctValue]);$event.stopPropagation()" style="cursor: pointer"> <span class="glyphicon" ng-class="isColFiltered(c,distinctObj.DistinctValue)?\'glyphicon-check\':\'glyphicon-unchecked\'" ></span> <small style="font-weight:normal"> <span ng-class="c.FilterClassFn(distinctObj)" style="margin-right:2px"> {{(distinctObj.DisplayValue != null && distinctObj.DisplayValue.toString() != \'\') ? distinctObj.DisplayValue : \'(Blanks)\'}} <span class="glyphicon" ng-class="c.FilterGlyphFn(distinctObj)"></span> </span> <span class="text-muted">({{distinctObj.DistinctCount}})</span> </small> </li> </ul> </div> </th> </tr> <tr ng-repeat-start="row in (gridFilteredRows =  (rows | orderBy:gridSortColumn:gridSortOrder | filter:canShowRecord)) | ngNgridPageOffset: (gridCurrentPage-1)*gridPageSize  | limitTo:gridPageSize" style="border-bottom: none" ng-class="{\'ngngrid-animaterow\':row.isNgNgridUpdated,\'info\':row.isNgNgridSelected,\'warning\':row.isNgNgridDirty}"> <td ng-if="childColumndefinitions.length > 0"> <span ng-click="row.isNgNgridOpen = !row.isNgNgridOpen" ng-disabled="childRowsCount(row) <= 0" data-toggle="tooltip" title="{{row.isNgNgridOpen?\'Collapse Details\':\'Expand Details\'}}" style="cursor:pointer"> <span class="glyphicon" ng-class="row.isNgNgridOpen?\'glyphicon-minus-sign\':\'glyphicon-plus-sign\'"></span> <sub ng-show="showChildrenCount">{{childRowsCount(row)}}</sub> </span> </td> <td ng-show="showRowNumbers">{{$index+1}}</td> <td ng-show="showRowSelector" ng-click="row.isNgNgridSelected = !row.isNgNgridSelected" style="cursor:pointer" data-toggle="tooltip" title="Select/Unselect Row"> <span class="glyphicon" ng-class="row.isNgNgridSelected ?  \'glyphicon-check\': \'glyphicon-unchecked\'"></span> </td> <td ng-repeat="c in columnDefinitions" ng-class="c.CellClassFn(row)" ng-hide="c.isNgNgridColumnHide"> <span ng-show="$index ==0 && row.isNgNgridDirty" class=\'glyphicon glyphicon-edit\'></span> <span ng-switch="c.ColumnType">    <label ng-switch-when="ngNGridLabel" class="label {{c.ClassFn(row)}}" data-toggle="tooltip" data-placement="right" title="{{c.TooltipFn(row)}}"> <span class="glyphicon {{c.GlyphFn(row)}}"></span> {{c.TextFn ?  c.TextFn(row) :  row[c.Name]}} <span ng-show="c.BadgeFn" class="badge" ng-class="c.BadgeClass">{{c.BadgeFn(row)}}</span> </label> <button ng-switch-when="ngNGridButton" ng-disabled="c.DisabledFn(row)" class="btn  btn-xs  {{c.ClassFn(row)}}" data-toggle="tooltip" data-placement="right" title="{{c.TooltipFn(row)}}" ng-click="c.ClickFn(row)"> <span class="glyphicon  {{c.GlyphFn(row)}}"></span> {{c.TextFn ?  c.TextFn(row) :  row[c.Name]}} <span ng-show="c.BadgeFn" class="badge" ng-class="c.BadgeClass">{{c.BadgeFn(row)}}</span> </button> <span ng-switch-when="ngNGridDate" ng-class="c.ClassFn ? c.ClassFn(row) : \'\'"> <span class="glyphicon  {{c.GlyphFn(row)}}"></span> {{c.TextFn ?  c.TextFn(row) :  row[c.Name]|date:c.DateFormatFn(row)}} <span ng-show="c.BadgeFn" class="badge">{{c.BadgeFn(row)}}</span> </span> <span ng-switch-when="ngNGridSelect" class="input-group input-group-sm"> <span ng-show="c.ClassFn" class="input-group-addon" ng-class="c.ClassFn(row)"> <span class="glyphicon" ng-class="c.GlyphFn(row)"></span> </span> <select ng-if="c.SelectValue != null" class="form-control" ng-model="row[c.Name]" ng-options="o[c.SelectValue]  for o in  c.SelectFn(row)  track by o[c.SelectKey]" ng-change="row.isNgNgridDirty=true" required> <option value="">Select</option> </select> <select ng-if="c.SelectValue == null" class="form-control" ng-model="row[c.Name]" ng-options="o  for o in  c.SelectFn(row)  track by o" ng-change="row.isNgNgridDirty=true" required> <option value="">Select</option> </select> </span> <a ng-switch-when="ngNGridLink" href="{{c.UrlFn(row)}}" target="{{c.TargetFn ? c.TargetFn(row):\'_blank\'}}" ng-class="c.ClassFn(row)"> <span class="glyphicon  {{c.GlyphFn(row)}}"></span> {{c.TextFn ?  c.TextFn(row) :  row[c.Name]}} <span ng-show="c.BadgeFn" class="badge" ng-class="c.BadgeClass">{{c.BadgeFn(row)}}</span> </a> <span ng-switch-when="ngNGridInput" ng-class="c.GlyphFn?\'input-group\':\'\'"> <span ng-show="c.GlyphFn" class="input-group-addon" ng-class="c.ClassFn(row)"> <span class="glyphicon" ng-class="c.GlyphFn(row)"></span> </span> <input class="form-control" ng-model="row[c.Name]" ng-readonly="c.DisabledFn(row)" ng-change="row.isNgNgridDirty=true" placeholder="{{c.NullOrEmptyFn(row)}}" type="{{c.InputTypeFn(row)}}" /> </span> <span ng-switch-default ng-class="c.ClassFn ? c.ClassFn(row) : \'\'"> <span class="glyphicon {{c.GlyphFn(row)}}"></span> {{c.TextFn ?  c.TextFn(row) :  row[c.Name]}} <span ng-show="c.BadgeFn" class="badge" ng-class="c.BadgeClass">{{c.BadgeFn(row)}}</span> </span> <img ng-show="c.ImgFn" ng-class="c.ImgClassFn(row)" src="{{c.ImgFn(row)}}" /> </span> </td> </tr> <tr ng-repeat-end ng-if="row.isNgNgridOpen" ng-class="{\'ngngrid-animaterow\':row.isNgNgridUpdated,\'info\':row.isNgNgridSelected,\'warning\':row.isNgNgridDirty}"> <td></td> <td ng-show="showRowNumbers"></td> <td ng-show="showRowSelector"></td> <td colspan="{{columnDefinitions.length}}"> <table class="table table-condensed table-bordered table-striped" ng-repeat="childColDef in childColumndefinitions"> <tr> <th ng-repeat="childCol in childColDef"> <span ng-click="changeChildSort(childCol)" style="cursor:pointer"> <u> {{childCol.DisplayName}} </u> <span ng-show="isChildSorted(childCol)" class="glyphicon" ng-class="gridChildrenSortOrder?\'glyphicon-chevron-down\':\'glyphicon-chevron-up\'"></span> </span> </th> </tr> <tr ng-repeat="childRow in getChildRows(row,childPropertynames[$index]) | orderBy:gridChildrenSortColumn:gridChildrenSortOrder" ng-class="{\'ngngrid-animaterow\':childRow.isNgNgridUpdated,\'info\':childRow.isNgNgridSelected,\'warning\':childRow.isNgNgridDirty}"> <td ng-repeat="childCol in childColDef" ng-class="childCol.CellClassFn(childRow)"> <span ng-show="$index ==0 && childRow.isNgNgridDirty" class=\'glyphicon glyphicon-edit\'></span> <span ng-switch="childCol.ColumnType"> <label ng-switch-when="ngNGridLabel" class="label label-xs {{childCol.ClassFn(childRow)}}" data-toggle="tooltip" data-placement="right" title="{{childCol.TooltipFn(childRow)}}"> <span class="glyphicon {{childCol.GlyphFn(childRow)}}"></span> {{childCol.TextFn ?  childCol.TextFn(childRow) :  childRow[childCol.Name]}} <span ng-show="childCol.BadgeFn" class="badge" ng-class="childCol.BadgeClass">{{childCol.BadgeFn(childRow)}}</span> </label> <button ng-switch-when="ngNGridButton" ng-disabled="childCol.DisabledFn(childRow)" class="btn  btn-xs  {{childCol.ClassFn(childRow)}}" data-toggle="tooltip" data-placement="right" title="{{childCol.TooltipFn(childRow)}}" ng-click="childCol.ClickFn(childRow)"> <span class="glyphicon  {{childCol.GlyphFn(childRow)}}"></span> {{childCol.TextFn ?  childCol.TextFn(childRow) :  childRow[childCol.Name]}} <span ng-show="childCol.BadgeFn" class="badge" ng-class="childCol.BadgeClass">{{childCol.BadgeFn(childRow)}}</span> </button> <span ng-switch-when="ngNGridDate" ng-class="childCol.ClassFn ? childCol.ClassFn(childRow) : \'\'"> <span class="glyphicon  {{childCol.GlyphFn(childRow)}}"></span> {{childCol.TextFn ?  childCol.TextFn(childRow) :  childRow[childCol.Name]|date:childCol.DateFormatFn(childRow)}} <span ng-show="childCol.BadgeFn" class="badge" ng-class="childCol.BadgeClass">{{childCol.BadgeFn(childRow)}}</span> </span> <span ng-switch-when="ngNGridSelect" class="input-group"> <span ng-show="childCol.ClassFn" class="input-group-addon" ng-class="childCol.ClassFn(row)"> <span class="glyphicon" ng-class="childCol.GlyphFn(row)"></span> </span> <select ng-if="childCol.SelectValue != null" name="status" ng-disabled="childCol.DisabledFn(childRow)" class="form-control" ng-model="childRow[childCol.Name]" ng-options="o[childCol.SelectValue]  for o in  childCol.SelectFn(childRow)  track by o[childCol.SelectKey]" ng-change="childRow.isNgNgridDirty=true" required> <option value="">Select</option> </select> <select ng-if="childCol.SelectValue == null" name="status" ng-disabled="childCol.DisabledFn(childRow)" class="form-control" ng-model="childRow[childCol.Name]" ng-options="o  for o in  childCol.SelectFn(childRow)  track by o" ng-change="childRow.isNgNgridDirty=true" required> <option value="">Select</option> </select> </span> <a ng-switch-when="ngNGridLink" href="{{childCol.UrlFn(childRow)}}" target="_blank"> <span class="glyphicon  {{childCol.GlyphFn(childRow)}}"></span> {{childCol.TextFn ?  childCol.TextFn(childRow) :  childRow[childCol.Name]}} <span ng-show="childCol.BadgeFn" class="badge" ng-class="childCol.BadgeClass">{{childCol.BadgeFn(childRow)}}</span> </a> <span ng-switch-when="ngNGridInput" ng-class="childCol.GlyphFn?\'input-group\':\'\'"> <span ng-show="childCol.GlyphFn" class="input-group-addon" ng-class="childCol.ClassFn(row)"> <span class="glyphicon" ng-class="childCol.GlyphFn(row)"></span> </span> <input class="form-control" ng-model="childRow[childCol.Name]" ng-readonly="childCol.DisabledFn(childRow)" ng-change="childRow.isNgNgridDirty=true" placeholder="{{childCol.NullOrEmptyFn(childRow)}}" type="{{childCol.InputTypeFn(childRow)}}" /> </span> <span ng-switch-default ng-class="childCol.ClassFn ? childCol.ClassFn(childRow) : \'\'"> {{childCol.TextFn ?  childCol.TextFn(childRow) :  childRow[childCol.Name]}} <span class="glyphicon {{childCol.GlyphFn(childRow)}}"></></span> <span ng-show="childCol.BadgeFn" class="badge" ng-class="childCol.BadgeClass">{{childCol.BadgeFn(childRow)}}</span> </span> </span> </td> </tr> </table> <table class="table table-condensed table-bordered table-striped" ng-if="rowFooterdefinitions.length > 0"> <tr ng-repeat="rowFooter in rowFooterdefinitions"> <td ng-repeat="footerItem in rowFooter"> <span ng-switch="footerItem.ColumnType"> <span ng-switch-when="ngNGridButton"> <span class="btn-group"> <button class="btn {{footerItem.ClassFn(row)}}" data-toggle="tooltip" data-placement="right" title="{{footerItem.TooltipFn(row)}}" ng-click="footerItem.ClickFn(row)" ng-disabled="footerItem.DisabledFn(row)"> <span class="glyphicon {{footerItem.GlyphFn(row)}}"></span> <span ng-show="footerItem.BadgeFn" class="badge" ng-class="footerItem.BadgeClass">{{footerItem.BadgeFn(row)}}</span> {{footerItem.TextFn(row)}} </button> </span> </span> <span ng-switch-when="ngNGridLabel"> <span class="label label-xs {{footerItem.ClassFn(row)}}" data-toggle="tooltip" data-placement="right" title="{{footerItem.TooltipFn(row)}}"> <span class="glyphicon {{footerItem.GlyphFn(row)}}"></span> <span ng-show="rowFooter.BadgeFn" class="badge" ng-class="footerItem.BadgeClass">{{footerItem.BadgeFn(row)}}</span> {{footerItem.TextFn(row)}} </span> </span> <span ng-switch-default ng-class="footerItem.ClassFn(row)"> {{footerItem.TextFn(row)}} </span> </span> </td> </tr> </table> </td> </tr> </table> <progressbar ng-show="rowsLoading" class="active progress-striped" value="100" type="primary"> <b><i>{{rowsLoadingText}}</i></b> </progressbar> </div> </div>');
});
*/