var appNgNgrid = angular.module('NgNgridApp', ['ngNgrid']);
appNgNgrid.controller('GithubdsController', ['$scope', '$timeout',
    function ($scope, $timeout) {
               
        
        $scope.loadingRecords = false;
        $scope.shows = true;
        $scope.data = [];
        //$scope.data = JSON.parse($scope.jsonData);
        $scope.columnDefs = [
            {
                Name: 'id',
                DisplayName: 'Id'                           
                
            },
             {
                 Name: 'type',
                 DisplayName: 'type'                 
             },
              {
                  Name: 'actor.avatar_url',
                  DisplayName: 'actor',
                  ColumnType: 'ngNGridLink',
                  UrlFn: function(r){return r.actor.avatar_url;},
                  ImgFn: function (r) {                      
                      return r.actor.avatar_url;
                  },
                  ImgClassFn: function (r) {                      
                      return 'img-responsive thumbnail-img';
                  }
              },
               {
                   Name: 'repo',
                   DisplayName: 'repo',
                   TextFn: function (r) { return r[this.Name].name; }
                   
               },
                {
                    Name: 'payload',
                    DisplayName: 'payload',
                    TextFn: function (r) { return r[this.Name].description; }
                },
                 {
                     Name: 'public',
                     DisplayName: 'public'                     
                 },
                  {
                      Name: 'created_at',
                      DisplayName: 'created_at',                                            
                      ColumnType: 'ngNGridDate',
                      DateFormatFn: function (r) { return 'dd:MM:yyyy hh:mm:ss';}

                  },
        ];

        $scope.onimport = function (r) {

        }
    }]);

