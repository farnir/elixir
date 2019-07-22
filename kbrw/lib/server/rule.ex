defmodule MyRules do
    use Rulex
    defrule paypal_fsm(%{"payment_method" => "paypal"} = _order, acc), do: 
        {:ok, [MyFSM.Paypal | acc]}
    defrule stripe_fsm(%{"payment_method" => "stripe"} = _order, acc), do:
        {:ok, [MyFSM.Stripe | acc]}
    defrule delivery_fsm(%{"payment_method" => "delivery"} = _order, acc), do:
        {:ok, [MyFSM.Delivery | acc]}
end