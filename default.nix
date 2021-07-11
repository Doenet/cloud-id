with import <nixpkgs> {};

mkYarnPackage rec {
    name = "circle-z-backend";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    meta = with pkgs.lib; {
      description = "Ross Program Circle Z webservices";
      license = licenses.agpl3;
      homepage = "https://github.com/rossprogram/circle-z-backend";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
