defmodule MyRules do
    use Rulex
    defrule my_first_rule("y" <> _, acc), do:
        {:ok, [:starts_with_y | acc]}
    defrule my_second_rule("yahoo",_acc), do:
        {:error, :yahoo_is_err}
end