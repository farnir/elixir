defimpl ExFSM.Machine.State, for: Map do
    def state_name(order), do: String.to_atom(order["status"]["state"])
    def set_state_name(order, name), do: Kernel.get_and_update_in(order["status"]["state"], fn state -> {state, Atom.to_string(name)} end)
    def handlers(order) do
      order["payment_handler"]
    end
  end
  
defmodule MyFSM.Paypal do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end
  end

  defmodule MyFSM.Stripe do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end

    deftrans not_verified({:verif_failed, []}, order) do 
      {:next_state, :payment_failed, order}
    end
  end

  defmodule MyFSM.Delivery do                                                                                      
    use ExFSM
  
    deftrans init({:process_payment, []}, order) do 
      {:next_state, :not_verified, order}
    end 
  
    deftrans not_verified({:verification, []}, order) do 
      {:next_state, :finished, order}
    end
  end

  defmodule KBRW.Transistor do
    use GenServer
    
    def start_link({event, id}) do
        {:ok, pid} = GenServer.start_link(__MODULE__, id, name: __MODULE__)
        changeState(pid, event)
    end

    def changeState(pid, event) do
        result = GenServer.call(pid, {event})
        GenServer.stop(pid)
        result
    end
    
    @impl true
    def init(id) do
  		{:ok, id}
    end
    
    def applyTransition(order, event) do
      {state, tmporder} = ExFSM.Machine.event(order["payment"], {event, []})
      cond do
        state == :next_state ->
          {:next_state, {_, new_order}} = {state, tmporder}
          Map.put(order, "payment", new_order)
        true -> :error
      end
    end

    @impl true
    def handle_call({event}, _from, intern_state) do
        {_, record} = KBRW.Riak.getObject('buck', intern_state)
        order = Poison.Parser.parse!(record)
        {fsm, _} = MyRules.apply_rules(order["payment"], [])
        order = Map.put(order, "payment", Map.put(order["payment"], "payment_handler", fsm))
        order = applyTransition(order, event)
        cond do
          order != :error -> 
            order = cond do
              order["payment"]["payment_method"] == "stripe" ->
                applyTransition(order, :verif_failed)
              true -> order
            end
            KBRW.Riak.createObject('buck', Poison.encode!(order), intern_state)
            {:reply, order, intern_state}
          true -> {:reply, :error, intern_state}
        end
	end
  end