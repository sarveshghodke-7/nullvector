{ pkgs ? import <nixpkgs> {}}:

let 
  my-python = pkgs.python313.withPackages (ps: with ps; [
    pandas
    numpy
    joblib
    xgboost
    scikit-learn
    matplotlib
    seaborn
  ]
  );
in 
pkgs.mkShell {
    packages = [
    my-python
    pkgs.htop
    ];
  }
