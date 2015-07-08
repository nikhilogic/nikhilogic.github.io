var appNgNgrid = angular.module('NgNgridApp', ['ngNgrid']);
appNgNgrid.controller('HomeController', ['$scope','$timeout',
    function ($scope, $timeout) {

        $scope.aSortcolumn = '';
        $scope.aSortdesc = false;
        var dt = new Date();
        var d1 = new Date();
        var d2 = new Date();
        d1.setDate(dt.getDate() + 1);
        d2.setDate(dt.getDate() + 2);        
        $scope.data = [];    
        $scope.loadingRecords = true;
        $scope.variety = 1;
        $scope.variety2 = 3;
        $scope.variety3 = 5;
        $scope.colFilters = [];
        $scope.loadRows = function () {
            var v = 0;
            var v2 = 0;
            var v3 = 0;
            for (var i = 0; i < 100; i++) {
                if (v > $scope.variety) {
                    v = 0;
                }
                if (v2 > $scope.variety2) {
                    v2 = 0;
                }
                if (v3 > $scope.variety3) {
                    v3 = 0;
                }
                var dtRow = new Date();
                dtRow.setDate(dt.getDate() + i);
                $scope.data.push(
                     {
                         Col1String: 'String data ' + v,
                         Col2Label: 'Label data ' + v2,
                         Col3Button: 'Button data',
                         Col4Number: v3,
                         Col5Date: dtRow,
                         Col6Link: 'somelink',
                         Col7Input: '',
                         Col8Select: { myKey: '222', myVal: '222Value' },                         
                         Children1: [
                             {
                                 ChildCol1String: 'childstringval1',
                                 ChildCol2Label: 'childlabelval1'
                             },
                              {
                                  ChildCol1String: 'childstringval2',
                                  ChildCol2Label: 'childlabelval2'
                              }
                         ],
                         Children2: [
                               {
                                   Child2Col1String: 'child2stringval1',
                                   Child2Col2Label: 'child2labelval1'
                               },
                              {
                                  Child2Col1String: 'child2stringval2',
                                  Child2Col2Label: 'child2labelval2'
                              }
                         ]
                     }
                );
                v += 1;
                v2 += 1;
                v3 += 1;
                
            }
            $scope.loadingRecords = false;
        }
        $scope.loadRows();

        $scope.onCommentsClicked = function () {
            alert('test');
        }

        $scope.optionList = [{ myKey: '111', myVal: '111Value' }, { myKey: '222', myVal: '222Value' }];

        $scope.childColumndef1 = [
            {
                Name: 'ChildCol1String',
                DisplayName: 'String Child1 Column'
            },
            {
                Name: 'ChildCol2Label',
                DisplayName: 'Label Child1 Column',
                ColumnType: 'ngNGridLabel',
                ClassFn: function (r) { return 'label-warning'; },
                GlyphFn: function (r) { return 'glyphicon-queen'; },
                TooltipFn: function (r) { return 'asd'; },
                FilterClassFn: function (c) { return 'label-warning'; },
                BadgeFn: function (r) { return r[this.Name].length; }
            }
        ];

        $scope.childColumndef2 = [
           {
               Name: 'Child2Col1String',
               DisplayName: 'String Child2 Column'
           },
           {
               Name: 'Child2Col2Label',
               DisplayName: 'Label Child2 Column',
               ColumnType: 'ngNGridInput',
               ClassFn: function (r) { return 'label-danger'; },
               GlyphFn: function (r) { return 'glyphicon-queen'; },
               TooltipFn: function (r) { return 'asd'; },
               FilterClassFn: function (c) { return 'label-danger'; },
               BadgeFn: function (r) { return r[this.Name].length; }
           }
        ];               

        $scope.childColDefs = [$scope.childColumndef1, $scope.childColumndef2];

        $scope.columnDefs = [
               {
                   Name: 'Col1String',
                   DisplayName: 'Default Column',
                   GlyphFn: function (r) { return 'glyphicon-king'; },
                   BadgeFn: function (r) { return r[this.Name].length; },
                   ClassFn: function (r) { return 'text-primary'; }
               },
               {
                   Name: 'Col2Label',
                   DisplayName: 'ngNGridLabel Column',
                   ColumnType: 'ngNGridLabel',
                   ClassFn: function (r) {
                       switch (r[this.Name]) {
                           case 'Label data 0':
                               return 'label label-info';
                               break;
                           case 'Label data 1':
                               return 'label label-success';
                               break;
                           case 'Label data 2':
                               return 'label label-default';
                               break;
                           case 'Label data 3':
                               return 'label label-warning';
                               break;
                       }
                   },
                   GlyphFn: function (r) { return 'glyphicon-queen' },
                   TooltipFn: function (r) { return 'asd'; },                   
                   FilterClassFn: function (c) {
                       
                       switch (c.DistinctValue) {
                           case 'Label data 0':
                               return 'label label-info';
                               break;
                           case 'Label data 1':
                               return 'label label-success';
                               break;
                           case 'Label data 2':
                               return 'label label-default';
                               break;
                           case 'Label data 3':
                               return 'label label-warning';
                               break;

                       }
                       
                   }                   
               },
               {
                   Name: 'Col3Button',
                   DisplayName: 'ngNGridButton Column',
                   ColumnType: 'ngNGridButton',
                   ClassFn: function (r) { return 'btn-primary'; },
                   GlyphFn: function (r) { return 'glyphicon-pawn'; },
                   TooltipFn: function (r) { return 'some tool-tip'; },
                   ClickFn: function (r) {
                       r.isNgNgridUpdated = true;
                       logDebug(formatJson(r));
                       $timeout(function () {
                           r.isNgNgridUpdated = false;
                       },5000);
                   },                   
                   DisableFilter: false,                   
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col4Number',
                   DisplayName: 'ngNGridNumber Column',
                   ClassFn: function (r) {
                       switch (r[this.Name]) {
                           case 0:
                               return 'text-primary';
                               break;
                           case 1:
                               return 'text-success';
                               break;
                           case 2:
                               return 'text-warning';
                               break;
                           case 3:
                               return 'text-danger';
                               break;
                           case 4:
                               return 'text-muted';
                               break;
                           case 5:
                               return 'text-default';
                               break;
                           case 6:
                               return '';
                               break;
                           default:

                       }
                       
                   },
                   GlyphFn: function (r) { return 'glyphicon-bishop'; },
                   BadgeFn: function (r) { return r[this.Name].toString().length; },
                   ColumnType: 'ngNGridNumber'
                  
               },                            
               {
                   Name: 'Col5Date',
                   DisplayName: 'ngNGridDate Column',
                   ColumnType: 'ngNGridDate',
                   ClassFn: function (r) { return 'text-muted'; },
                   GlyphFn: function (r) { return 'glyphicon-knight'; },
                   BadgeFn: function (r) { return r[this.Name].toString().length; },
                   DateFormatFn: function (r) { return 'yyyy-MM-dd HH:mm:ss'; },
                   FilterDateFormatFn : function(c){ return  'yyyy-MM-dd HH:mm:ss';}
               },
               {
                   Name: 'Col6Link',
                   DisplayName: 'ngNGridLink Column',
                   ColumnType: 'ngNGridLink',
                   ClassFn: function (r) { return 'text-default'; },
                   UrlFn: function (r) { return 'https://github.com/nikhilogic/nikhilogic.github.io'; },
                   TextFn: function (r) { return 'NgNGrid' },
                   GlyphFn: function (r) { return 'glyphicon-tower'; },
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col7Input',
                   DisplayName: 'ngNGridInput Column',
                   ClassFn: function (r) { return 'label-warning'; },
                   GlyphFn: function (r) { return 'glyphicon-queen' },
                   TooltipFn: function (r) { return 'asd'; },
                   NullOrEmptyFn: function(r) {return 'Edit me';},
                   ColumnType: 'ngNGridInput'
               }
               ,
               {
                   Name: 'Col8Select',
                   DisplayName: 'ngNGridSelect Column',
                   ColumnType: 'ngNGridSelect',
                   SelectFn: function (row) { return $scope.optionList; },
                   ClassFn: function (r) { return 'label-danger'; },
                   GlyphFn: function (r) { return 'glyphicon-queen' },
                   SelectKey: 'myKey',
                   SelectValue: 'myVal'
               }               
        ];
        
        $scope.filterColumnDemo = function (value)
        {
            logDebug(formatJson(value));            
            return false;
            return value.indexOf('Fn') == -1;
        }

        $scope.applyChange = function (c1, key, value) {
            for (var i = 0; i < $scope.columnDefs.length; i++) {
                if ($scope.columnDefs[i].Name == c1.Name) {
                    if (key.indexOf('Fn') != -1) {
                        $scope.columnDefs[i][key] = eval('(' + value + ')');
                    }
                    else {
                        logDebug(c1[key] + '  ' + value);
                        $scope.columnDefs[i][key] = value;                        
                    }
                }
            }

           
        }

        $scope.getScriptForCols = function (colObjs) {
            var strScript = '';
            for (j = 0; j < colObjs.length ; j++) {
                strScript += '[\r\n';
                for (i = 0; i < colObjs[j].length ; i++) {

                    strScript += '{\r\n';
                    //logDebug(formatJson($scope.columnDefs[i]));
                    Object.getOwnPropertyNames(colObjs[j][i]).forEach(function (val, idx, array) {
                        //logDebug(val + ':' + $scope.columnDefs[i][val]);
                        if (val != '$$hashKey') {
                            if (typeof colObjs[j][i][val] == 'string') {
                                strScript += val + ':\'' + colObjs[j][i][val] + '\',\r\n';
                            }
                            else if (colObjs[j][i][val] == undefined) {
                                strScript += val + ':null,\r\n';
                            }
                            else {
                                strScript += val + ':' + colObjs[j][i][val] + ',\r\n';
                            }

                        }
                    });
                    strScript = strScript.substring(0, strScript.length - 3);
                    strScript += '\r\n';

                    strScript += '},\r\n';
                }
                strScript = strScript.substring(0, strScript.length - 3);
                strScript += '\r\n];\r\n';
            }
            return strScript;
        }

        $scope.exportScript = function () {
            var strScript='';
            strScript +=  $scope.getScriptForCols([$scope.columnDefs]);
            strScript +=  $scope.getScriptForCols($scope.childColDefs);
            logDebug(strScript);
                      
            var blobObject = new Blob([strScript]); //[angular.toJson($scope.columnDefs)]);
            window.navigator.msSaveOrOpenBlob(blobObject, 'ngNGridColumnDefs.txt'); // The user only has the option of clicking the Save button.            
            
        }
       
    }]);
