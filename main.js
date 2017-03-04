var myApp = angular.module("myApp", []);
myApp.config([
    '$compileProvider',
    function ($compileProvider) {
        $compileProvider.aHrefSanitizationWhitelist(/^\s*(https?|ftp|mailto|chrome-extension|chrome):/);
        $compileProvider.imgSrcSanitizationWhitelist(/^\s*(https?|local|data|chrome-extension|chrome):/);

    }
]);
myApp.controller("mainController", ["$scope", "manager", function ($scope, manager) {
    $scope.extensions = [];
    $scope.selectedExtension = {
        name: 'My Extension'
    }
    $scope.loadInstalledExtensions = function () {
        chrome.management.getAll(function (data) {
            var loadedExtensions = data.map(function (extensionItem) {
                var extension = extensionItem;
                extension.iconURL = extensionItem.hasOwnProperty('icons') ? manager.getIconUrl(extensionItem.icons) : '/assets/icons/no-extension-icon.png';
                return extension;
            });
            $scope.$apply(function () {
                $scope.extensions = loadedExtensions;
                $scope.selectedExtension = $scope.extensions[0];
                $scope.disabledItems = $scope.extensions.filter(function (extension) {
                    return !extension.enabled;
                });
            });
        });
    };
    $scope.loadInstalledExtensions();

    $scope.selectExtension = function (extensionId) {
        var index = manager.getIndex($scope.extensions, 'id', extensionId);
        $scope.selectedExtension = $scope.extensions[index];
    }

    $scope.enableExtension = function (extensionId) {
        var index = manager.getIndex($scope.extensions, 'id', extensionId);
        chrome.management.setEnabled(extensionId, true, function () {
            $scope.$apply(function () {
                $scope.extensions[index].enabled = true;
                $scope.selectedExtension = $scope.extensions[index];
                $scope.disabledItems = $scope.extensions.filter(function (extension) {
                    return !extension.enabled;
                });
            });
        });
    };

    $scope.disableExtension = function (extensionId) {
        var index = manager.getIndex($scope.extensions, 'id', extensionId);
        chrome.management.setEnabled(extensionId, false, function () {
            $scope.$apply(function () {
                $scope.extensions[index].enabled = false;
                $scope.selectedExtension = $scope.extensions[index];
                $scope.disabledItems = $scope.extensions.filter(function (extension) {
                    return !extension.enabled;
                });
            });
        });
    };
    $scope.uninstallExtension = function (extensionId) {
        var options = { showConfirmDialog: true };
        var index = manager.getIndex($scope.extensions, 'id', extensionId);
        try {
            chrome.management.uninstall(extensionId, options, function () {
                if (chrome.runtime.lastError) {
                    console.error(chrome.runtime.lastError.message);
                } else {
                    $scope.$apply(function () {
                        $scope.extensions.splice(index, 1);
                        $scope.disabledItems = $scope.extensions.filter(function (extension) {
                            return !extension.enabled;
                        });
                    });
                }
            });

        } catch (e) {
            console.info(e.message);
        }
    };

}]);

myApp.factory("manager", function () {
    var _loadBestIcon = function (icons) {
        var icon = '';
        if (icons.length == 0) return icon

        var iconUrls = {};
        icons.forEach(function (val, key) {
            iconUrls[val.size] = val.url;
        });
        var sizesOfIcon = icons.map(function (icon) {
            return icon.size;
        });

        return iconUrls[Math.max.apply(null, sizesOfIcon)];
    };

    var _findIndex = function (data, key, value) {
        console.log(data);
        var index = 0;
        for (var i = 0; i < data.length; i++) {
            index = i;
            if (data[i][key] === value) {
                break;
            }
        }
        return index;
    };

    return {
        getIconUrl: _loadBestIcon,
        getIndex: _findIndex
    }
})

myApp.directive("extenionicon", function () {
    return {
        restrict: 'E',
        replace: false,
        scope: {
            url: '@url'
        },
        template: '<img ng-src={{url}} class="img-circle plugin-lg-icon pull-left" />',
    }
})

myApp.filter('maxLength', function () {
    return function (str, maxlimit) {
        var limit = parseInt(maxlimit);
        if (str.trim() == '') {
            return '';
        } else if (str.trim().length <= limit) {
            return str;
        } else {
            return str.substring(0, limit) + "..";
        }
    }
})