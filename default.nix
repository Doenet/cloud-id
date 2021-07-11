with import <nixpkgs> {};

mkYarnPackage rec {
    name = "id-server";
    src = ./.;
    packageJSON = ./package.json;
    yarnLock = ./yarn.lock;
    yarnNix = ./yarn.nix;
    postBuild = ''
      NODE_ENV=production yarn run build
    '';

    meta = with pkgs.lib; {
      description = "id.doenet.cloud webservices";
      license = licenses.agpl3;
      homepage = "https://github.com/Doenet/cloud-id";
      maintainers = with maintainers; [ kisonecat ];
      platforms = platforms.linux;
    };
}
