var appNgNgrid = angular.module('NgNgridApp', ['ngNgrid']);
appNgNgrid.controller('GithubdsController', ['$scope', '$timeout',
    function ($scope, $timeout) {
               
        
        $scope.loadingRecords = false;
        $scope.aSortcolumn = '';
        $scope.aSortdesc = false;
        $scope.data = [];
        //$scope.data = JSON.parse($scope.jsonData);
        $scope.columnDefs = [
            {
                Name: 'id',
                DisplayName: 'String(Default Type) Column',
                GlyphFn: function (r) { return 'glyphicon-king'; },
                BadgeFn: function (r) { return r[this.Name].length; },
                ClassFn: function (r) { return 'text-primary'; }
            },
             {
                 Name: 'type',
                 DisplayName: 'String(Default Type) Column',
                 GlyphFn: function (r) { return 'glyphicon-king'; },
                 BadgeFn: function (r) { return r[this.Name].length; },
                 ClassFn: function (r) { return 'text-primary'; }
             },
              {
                  Name: 'actor',
                  DisplayName: 'String(Default Type) Column',
                  GlyphFn: function (r) { return 'glyphicon-king'; },
                  BadgeFn: function (r) { return r[this.Name].length; },
                  ClassFn: function (r) { return 'text-primary'; },
                  TextFn: function (r) { return r[this.Name].avatar_url; },
                  ImgFn: function (r) { return r[this.Name].avatar_url; },
                  ImgClassFn: function (r) { return 'img-responsive'; }
              },
               {
                   Name: 'repo',
                   DisplayName: 'String(Default Type) Column',
                   GlyphFn: function (r) { return 'glyphicon-king'; },
                   BadgeFn: function (r) { return r[this.Name].length; },
                   ClassFn: function (r) { return 'text-primary'; },
                   TextFn: function (r) { return r[this.Name].name; }
                   
               },
                {
                    Name: 'payload',
                    DisplayName: 'String(Default Type) Column',
                    GlyphFn: function (r) { return 'glyphicon-king'; },
                    BadgeFn: function (r) { return r[this.Name].length; },
                    ClassFn: function (r) { return 'text-primary'; },
                    TextFn: function (r) { return r[this.Name].description; }
                },
                 {
                     Name: 'public',
                     DisplayName: 'String(Default Type) Column',
                     GlyphFn: function (r) { return 'glyphicon-king'; },
                     BadgeFn: function (r) { return r[this.Name].length; },
                     ClassFn: function (r) { return 'text-primary'; }
                 },
                  {
                      Name: 'created_at',
                      DisplayName: 'String(Default Type) Column',
                      GlyphFn: function (r) { return 'glyphicon-king'; },
                      BadgeFn: function (r) { return r[this.Name].length; },
                      ClassFn: function (r) { return 'text-primary'; },
                      ColumnType: 'ngNGridDate'

                  },
        ];

        $scope.onimport = function (r) {

        }
    }]);

