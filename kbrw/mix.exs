defmodule Kbrw.Mixfile do
  use Mix.Project

  def project do
    [app: :kbrw,
     version: "0.1.0",
     elixir: "~> 1.4",
     build_embedded: Mix.env == :prod,
     start_permanent: Mix.env == :prod,
     deps: deps(),
     compilers: [:reaxt_webpack] ++ Mix.compilers]
  end

  # Configuration for the OTP application
  #
  # Type "mix help compile.app" for more information
  def application do
    [
      applications: [:reaxt, :logger, :ewebmachine, :cowboy, :inets, :sa_deps],
      mod: {KBRW, []}
    ]
  end

  # Dependencies can be Hex packages:
  #
  #   {:mydep, "~> 0.3.0"}
  #
  # Or git/path repositories:
  #
  #   {:mydep, git: "https://github.com/elixir-lang/mydep.git", tag: "0.1.0"}
  #
  # Type "mix help deps" for more examples and options
  defp deps do
    [
      {:cowboy, "~> 1.0.0"},
      {:plug, "~> 1.3.4"},
      {:poison, "~> 2.1"},
      {:reaxt, "~> 2.0", github: "kbrw/reaxt"},
      {:exfsm, github: "kbrw/exfsm"},
      {:rulex, github: "kbrw/rulex"},
      {:ewebmachine, ">= 2.1.0", [env: :prod, repo: "hexpm", hex: "ewebmachine"]},
      {:sa_deps, git: "ssh://qrenaud@git.kbrwadventure.com/~git/sa_deps"}
    ]
  end
end
