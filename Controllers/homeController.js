var appNgNgrid = angular.module('NgNgridApp', ['ui.bootstrap', 'ngNgrid']);
appNgNgrid.controller('HomeController', ['$scope','$timer',
    function ($scope) {

        $scope.aSortcolumn = '';
        $scope.aSortdesc = false;        
        var dt = new Date();
        var d1 = new Date();
        var d2 = new Date();
        d1.setDate(dt.getDate() + 1);
        d2.setDate(dt.getDate() + 2);
        $scope.gridbottomids = ['ftr1'];
        $scope.data = [];    
        $scope.loadingRecords = true;
        $scope.loadRows = function () {
            for (var i = 0; i < 100; i++) {
                $scope.data.push(
                     {
                         Col1String: 'asd' + i,
                         Col2Label: 'lbl' + i,
                         Col3Collection: ['asdasd', 'asdasdasdasdqw'],
                         Col4Number: i,
                         Col5Date: dt,
                         Col6Link: 'somelink',
                         Col7Input: 'Edit me',
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
                Type: 'Label',
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
               Type: 'Label',
               ClassFn: function (r) { return 'label-danger'; },
               GlyphFn: function (r) { return 'glyphicon-queen'; },
               TooltipFn: function (r) { return 'asd'; },
               FilterClassFn: function (c) { return 'label-danger'; },
               BadgeFn: function (r) { return r[this.Name].length; }
           }
        ];
               

        $scope.columnDefs = [
               {
                   Name: 'Col1String',
                   DisplayName: 'String Column',
                   GlyphFn: function (r) { return 'glyphicon-king'; },
                   BadgeFn: function (r) { return r[this.Name].length; },
                   ClassFn: function (r) { return 'text-primary'; }
               },
               {
                   Name: 'Col2Label',
                   DisplayName: 'Label Column',
                   Type: 'Label',
                   ClassFn: function (r) { return 'label-info'; },
                   GlyphFn: function (r) { return 'glyphicon-queen' },
                   TooltipFn: function (r) { return 'asd'; },                   
                   FilterClassFn: function (c) { return 'label-primary'; },
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col3Collection',
                   DisplayName: 'Button Column',
                   Type: 'Button',
                   ClassFn: function (r) { return 'btn-success'; },
                   GlyphFn: function (r) { return 'glyphicon-pawn'; },
                   TooltipFn: function (r) { return 'some tool-tip'; },
                   ClickFn: function (r) {
                       r.isNgngridUpdated = true;
                       $timeout(function () {
                           r.isNgngridUpdated = false;
                       },5000);
                   },
                   SortProperty: 'length',
                   DisableFilter: true,
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col4Number',
                   DisplayName: 'Number Column',
                   ClassFn: function (r) { return 'text-warning'; },
                   GlyphFn: function (r) { return 'glyphicon-bishop'; },
                   BadgeFn: function (r) { return r[this.Name].length; }
               },                            
               {
                   Name: 'Col5Date',
                   DisplayName: 'Date Column',
                   Type: 'Date',
                   ClassFn: function (r) { return 'text-danger'; },
                   GlyphFn: function (r) { return 'glyphicon-knight'; },
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col6Link',
                   DisplayName: 'Link Column',
                   Type: 'Link',
                   ClassFn: function (r) { return 'text-default'; },
                   UrlFn: function (r) { return 'https://github.com/nikhilogic/ngNGrid'; },
                   TextFn: function (r) { return 'NgNGrid' },
                   GlyphFn: function (r) { return 'glyphicon-tower'; },
                   BadgeFn: function (r) { return r[this.Name].length; }
               },
               {
                   Name: 'Col7Input',
                   DisplayName: 'Input Column',                   
                   ClassFn: function (r) { return 'label-warning'; },
                   //GlyphFn: function (r) { return 'glyphicon-queen' },
                   //TooltipFn: function (r) { return 'asd'; },
                   Type:'Input'
               }
               ,
               {
                   Name: 'Col8Select',
                   DisplayName: 'Select Column',
                   Type: 'Select',
                   SelectFn: function (row) { return $scope.optionList; },
                   SelectKey: 'myKey',
                   SelectValue: 'myVal',
                   SortProperty: 'myVal'
               }
        ];


       
    }]);
