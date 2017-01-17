(
  function () {
    angular
    .module("multiSigWeb")
    .controller("newWalletCtrl", function ($scope, $uibModalInstance, $uibModal, Utils, Transaction, Wallet, callback) {

      $scope.owners = {};
      $scope.owners[Wallet.coinbase] = {
        name: 'My Account',
        address: Wallet.coinbase
      };

      $scope.confirmations = 1;
      $scope.limit = 0;

      $scope.removeOwner = function (address) {
        delete $scope.owners[address];
      };

      $scope.deployWallet = function () {
        Wallet.deployWithLimit(Object.keys($scope.owners), $scope.confirmations, new Web3().toBigNumber($scope.limit).mul('1e18'),
          function (e, contract) {
            if (e) {
              // Utils.dangerAlert(e);
              // Don't show anything, it could be a Tx Signature Rejected
            }
            else {
              if (contract.address) {
                // Save wallet
                Wallet.updateWallet({name: $scope.name, address: contract.address, owners: $scope.owners});
                Utils.success("Wallet deployed at address " + contract.address);
                Transaction.update(contract.transactionHash, {multisig: contract.address});
                callback();
              }
              else {
                $uibModalInstance.close();
                Transaction.add({txHash: contract.transactionHash});
                Utils.notification("Deployment transaction was sent.");
              }
            }
          }
        );
      };

      $scope.deployOfflineWallet = function () {
        Wallet.deployWithLimitOffline(Object.keys($scope.owners), $scope.confirmations, new Web3().toBigNumber($scope.limit).mul('1e18'),
        function (e, signed) {
          if (e) {
            Utils.dangerAlert(e);
          }
          else {
            $uibModalInstance.close();
            Utils.signed(signed);
          }
        });
      };

      $scope.deployFactoryWallet = function () {
        Wallet.deployWithLimitFactory(Object.keys($scope.owners), $scope.confirmations, new Web3().toBigNumber($scope.limit).mul('1e18'),
          function (e, tx) {
            if (e) {
              Utils.dangerAlert(e);
            }
            else {
              $uibModalInstance.close();
              Utils.notification("Deployment transaction sent to factory.");
              Transaction.add(
                {
                  txHash: tx,
                  callback: function(receipt){
                    var walletAddress = receipt.decodedLogs[0].info.instantiation;
                    Utils.success("Wallet deployed at address " + walletAddress);
                    Wallet.updateWallet({name: $scope.name, address: walletAddress, owners: $scope.owners});
                    Transaction.update(tx, {multisig: walletAddress});
                    callback();
                  }
                }
              );
            }
          }
        );
      };

      $scope.deployFactoryWalletOffline = function () {
        Wallet.deployWithLimitFactoryOffline(Object.keys($scope.owners), $scope.confirmations, new Web3().toBigNumber($scope.limit).mul('1e18'),
          function (e, signed) {
            if (e) {
              Utils.dangerAlert(e);
            }
            else {
              $uibModalInstance.close();
              Utils.signed(signed);
            }
          }
        );
      };

      $scope.cancel = function () {
        $uibModalInstance.dismiss();
      };

      $scope.addOwner = function () {
        $uibModal.open({
          animation: false,
          templateUrl: 'partials/modals/addOwner.html',
          size: 'sm',
          controller: function ($scope, $uibModalInstance) {
            $scope.owner = {
              name: "",
              address: ""
            };

            $scope.ok = function () {
              $uibModalInstance.close($scope.owner);
            };

            $scope.cancel = function () {
              $uibModalInstance.dismiss();
            };
          }
        })
        .result
        .then(
          function (owner) {
            $scope.owners[owner.address] = owner;
          }
        );
      };
    });
  }
)();
