class Dc4u < Formula
  desc "Draft Charges 4 U - Legal Document Generator"
  homepage "https://github.com/gongahkia/dc4u"
  url "https://github.com/gongahkia/dc4u/archive/refs/tags/v2.0.0.tar.gz"
  sha256 "PLACEHOLDER_SHA256"
  license "MIT"

  depends_on "perl"

  def install
    cd "v2" do
      system "perl", "Makefile.PL", "INSTALL_BASE=#{prefix}"
      system "make"
      system "make", "install"
    end

    # install config
    etc.install "v2/config/dc4u.yaml" => "dc4u/dc4u.yaml"

    # install templates
    (share/"dc4u/templates").install Dir["v2/templates/*"]
  end

  test do
    system "#{bin}/dc4u", "--version"
  end
end
