/* 

TODO: format this later
     columnDefinitions: '=',
            childColumndefinitions: '=',
            childPropertynames: '@',
            rowFooterdefinitions: '=',
            rows: '=',
            rowsLoading: '=',
            rowsLoadingText: '@',            
            gridSortColumn: '=initialSortcolumn',
            gridSortOrder: '=initialSortdesc',
            gridFilters: '=',
            showRowNumbers: '=',
            gridHeightFixed: '=',
            gridHeightStretchBottomOffset: '='


 Documentation for Column Definitions
                   
        PropertyName: 'Comments',
        DisplayName: 'Comments',
        Type: 'Button',                   

        DisableSort: true,
        SortProperty: 'length',

        DisableFilter: false,
        FilterClassFn: function (distinctItem) { return 'label-warning'; },
        FilterTextFn: function(r) {return "ASD";},   
        FilterGlyphFn: function (r) { return 'glyphicon-comment'; },
        FilterTooltipFn: function (r) { return 'Click to open/add comments'; },

        TextFn: function(r) {return "ASD";},   
        ClassFn: function (r) { return 'btn-default'; },
        GlyphFn: function (r) { return 'glyphicon-comment'; },
        TooltipFn: function (r) { return 'Click to open/add comments'; },        
        BadgeFn : function(r) {return '1';}
        DisableFn: function(r) {return 'asd';},
        ClickFn: $scope.onCommentsClicked                   


        TODO: filter blanks?
        date range
        scroll rows only
                   
 */



angular.module('ngNgrid', [])
.directive('ngNgrid', function ($filter, $window, $timeout) {

    function link(scope, element, attrs) {
        scope.pageSizeOptions = [10, 15, 20, 50, 100, 500, 1000];
        scope.gridCurrentPage = 1;
        scope.gridPageSize = 15;
        scope.gridChildrenSortOrder = false;
        scope.gridChildrenSortColumn = '';
        scope.customFilter = [];
        scope.customFilter.ColumnFilters = [];
        scope.filterSelectionList = [];

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

        scope.gridTotalPages = function () {
            return Math.ceil(scope.rows.length / scope.gridPageSize);
        }

        scope.canShowGroup = function () {
            return true;
        }

        scope.changeSort = function (sortCol) {
            scope.gridSortOrder = !scope.gridSortOrder;
            scope.gridSortColumn = scope.getSortProperty(sortCol);
        }

        scope.isSorted = function (sortCol) {
            return (scope.gridSortColumn == scope.getSortProperty(sortCol));
        }

        scope.changeChildSort = function (sortCol) {
            scope.gridChildrenSortOrder = !scope.gridChildrenSortOrder;
            scope.gridChildrenSortColumn = scope.getSortProperty(sortCol);
        }

        scope.isChildSorted = function (sortCol) {
            return (scope.gridChildrenSortColumn == scope.getSortProperty(sortCol));
        }

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

        scope.getValueFromProp = function (objValue, propString) {
            var tempSortProp = null;
            if (propString != null) {
                var arrSplitSortProp = propString.split('.');
                for (var i = 0; i < arrSplitSortProp.length; i++) {
                    if (i == 0) {
                        tempSortProp = objValue[arrSplitSortProp[i]];
                    }
                    else if (tempSortProp == null) {
                        break;
                    }
                    else {
                        tempSortProp = tempSortProp[arrSplitSortProp[i]];
                    }
                }
            }
            return tempSortProp;
        }

        scope.getChildRows = function (row, childColName) {
            return scope.getValueFromProp(row, childColName);
        }

        scope.childRowsCount = function (row) {
            var childRecCount = 0;
            for (var i = 0; i < scope.childPropertynames.length; i++) {
                var tempChildRows = scope.getValueFromProp(row, scope.childPropertynames[i]);
                childRecCount += tempChildRows ? tempChildRows.length : 0;
            }
            return childRecCount;
        }

        scope.getColValue = function (col, row) {
            var val = null;
            if (row[col.Name] != null) {
                if (col.SortProperty != null) {
                    val = scope.getValueFromProp(row[col.Name], col.SortProperty);
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

        scope.distinctColValues = function (col) {
            var distinctValues = [];
            var colName = scope.getSortProperty(col);
            for (i = 0, len = scope.rows.length ; i < len; i++) {
                var colValue = scope.getColValue(col, scope.rows[i]);
                if (colValue != null) {
                    if (distinctValues.indexOf(colValue) == -1) {
                        distinctValues.push(colValue);
                    }
                }
            }
            distinctValues.sort();
            return distinctValues;
        };
        scope.iCounter = 0
        scope.distinctColValuesFiltered = function (col) {
            //logDebug('distinctColValuesFiltered ' + scope.iCounter++);
            var colName = scope.getSortProperty(col);
            var filteredList = [];
            var filteredRows = scope.gridFilteredRows;

            if (filteredRows.length == scope.rows.length || (scope.customFilter.ColumnFilters[colName] != null && scope.customFilter.ColumnFilters[colName].IsFirstFilter)) {
                filteredList = scope.distinctColValues(col);
            }
            else if (scope.isColNameFilterApplied(colName)) {
                //Filtered applied to me-  and I am not the first filter
                //check to see if I have saved the list 
                filteredList = scope.filterSelectionList[colName];
            }
            else {
                //in these filtered rows find current col values
                for (var i = 0; i < filteredRows.length; i++) {
                    var temp = scope.getColValue(col, filteredRows[i]);

                    if (filteredList.indexOf(temp) <= -1) {
                        filteredList.push(temp);
                    }
                }
                scope.filterSelectionList[colName] = filteredList;
            }
            return filteredList;
        }

        scope.clearColFilters = function (colName) {
            delete scope.customFilter.ColumnFilters[colName];
        }

        scope.toggleColFilters = function (col) {
            var colName = scope.getSortProperty(col);
            if (scope.isColNameFilterApplied(colName)) {
                //clear all filters
                scope.clearColFilters(colName);
                scope.gridFiltersChanged({ filterColumnName: colName, filterString: '', isAdded: false });
            }
            else {
                //select all values which are filtered in drop down list                
                for (var i = 0; i < col.DropdownFilteredValues.length; i++) {
                    scope.addColumnFilter(col, col.DropdownFilteredValues[i], true);
                    scope.gridFiltersChanged({ filterColumnName: colName, filterString: col.DropdownFilteredValues[i], isAdded: true });
                }
            }
        }

        scope.$on('ngNGrid_FilterChange', function (event, filterCol, filterString) {
            scope.addColumnFilter(filterCol, filterString, true);
        });

        scope.addColumnNameFilter = function (colName, filterString, allowMultiple) {
            if (filterString != null) {
                filterString = filterString.toString().trim().toLowerCase();
                var firstFilter = false;
                if (Object.keys(scope.customFilter.ColumnFilters).length <= 0) {
                    firstFilter = true;
                }
                if (scope.customFilter.ColumnFilters[colName] == null) {
                    scope.customFilter.ColumnFilters[colName] = [];
                }
                if (allowMultiple) {
                    var posFilter = scope.customFilter.ColumnFilters[colName].indexOf(filterString);
                    if (posFilter == -1) {

                        //item  not found - add it
                        scope.customFilter.ColumnFilters[colName].push(filterString);
                        //Is this column already the FirstFilter?
                        if (!scope.customFilter.ColumnFilters[colName].IsFirstFilter) {
                            scope.customFilter.ColumnFilters[colName].IsFirstFilter = firstFilter;
                        }
                        scope.gridFiltersChanged({ filterColumnName: colName, filterString: filterString, isAdded: true });
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
                        scope.gridFiltersChanged({ filterColumnName: colName, filterString: filterString, isAdded: false });
                    }
                }
                else {
                    scope.customFilter.ColumnFilters[colName] = [filterString];
                    if (filterString == '') {
                        scope.customFilter.ColumnFilters[colName].IsFirstFilter = false;
                    }
                    else {
                        scope.customFilter.ColumnFilters[colName].IsFirstFilter = firstFilter;
                    }
                }
            }
        }

        scope.addColumnFilter = function (col, filterString, allowMultiple) {
            var colName = scope.getSortProperty(col);
            scope.addColumnNameFilter(colName, filterString, allowMultiple);
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
            scope.gridFiltersChanged({ filterColumnName: '', filterString: '', isAdded: false });
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
                scope.rows[i].isNgngridSelected = !scope.allRowsSelected;
            }
            scope.allRowsSelected = !scope.allRowsSelected;
        }

        
        scope.on_fileUpload = function (element) {            
            //logDebug(element.files);
            scope.files = [];
            for (var i = 0; i < element.files.length; i++) {
                //scope.rows.push(element.files[i]);
                //logDebug('raw file' + element.files[i]);
                var reader = new FileReader();
                reader.readAsText(element.files[i]);               

                reader.onload = function (e) {
                    //logDebug(reader.result);
                    var arrRows = angular.fromJson(reader.result);
                    var colDates = [];
                    //do we have any date columns?
                    for (var c = 0; c < scope.columnDefinitions.length; c++) {
                        if (scope.columnDefinitions[c].Type == 'Date') {
                            logDebug('found date column' + scope.columnDefinitions[c].Name);
                            colDates.push(scope.columnDefinitions[c].Name);
                        }
                    }

                    for (var j = 0; j < arrRows.length; j++) {
                        //check for any date objects
                        for (var c = 0; c < colDates.length; c++) {
                            if (arrRows[j][colDates[c]] != null) {
                                logDebug('seeting new date');
                                arrRows[j][colDates[c]] = new Date(arrRows[j][colDates[c]]);
                            }
                        }
                        scope.rows.unshift(arrRows[j]);
                    }
                    
                    scope.$apply();                  
                    
                }

                
            }
        };


        scope.importFromJson = function () {
            var fileUpload = document.getElementById("fileUploadJson");
            fileUpload.click();
        }

        scope.isAnyRowSelected = function () {
            for (var i = 0; i < scope.rows.length; i++) {
                if (scope.rows[i].isNgngridSelected) {
                    return true;
                }
            }
            return false;
        }
        scope.exportSelectedToJson = function () {
            var selectedRows = [];
            for (var i = 0; i < scope.rows.length; i++) {
                if (scope.rows[i].isNgngridSelected) {
                    selectedRows.push(scope.rows[i]);
                }
            }
            var blobObject = new Blob([angular.toJson(selectedRows)]);  //Blob(JSON.stringify(scope.rows));
            window.navigator.msSaveBlob(blobObject, 'ngNGridExport.json'); // The user only has the option of clicking the Save button.            
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
            gridFiltersChanged: '&'
        },
        templateUrl: '../Templates/NgNgridTemplate.html',
        link: link
    };
})


.filter('ngNgridPageOffset', function () {
    return function (input, start) {
        return input.slice(start);
    };
})

