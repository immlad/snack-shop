// Replace with your Supabase project URL and anon key
const supabaseClient = supabase.createClient(
  "https://fznvokjfavvegqhrcyov.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ6bnZva2pmYXZ2ZWdxaHJjeW92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYzNjMxODcsImV4cCI6MjA5MTkzOTE4N30.yF4NlP1rbv8OlHOOhDDKk7W4QEG4CDhaWIjA8cQGZmg"
);

const ordersBody = document.getElementById("ordersBody");
const bubble = document.getElementById("bubble");
let chart;

function showBubble(msg) {
  bubble.textContent = msg;
  bubble.classList.add("show");
  setTimeout(() => bubble.classList.remove("show"), 1500);
}

async function loadOrders() {
  const { data, error } = await supabaseClient
    .from("snack_orders")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    showBubble("Error loading orders");
    return;
  }

  ordersBody.innerHTML = "";

  data.forEach((order) => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${order.id.slice(0, 8)}</td>
      <td>$${order.total}</td>
      <td>${order.status}</td>
      <td>
        <button onclick="updateStatus('${order.id}', 'preparing')">Prep</button>
        <button onclick="updateStatus('${order.id}', 'shipped')">Ship</button>
        <button onclick="updateStatus('${order.id}', 'delivered')">Done</button>
        <button onclick="updateStatus('${order.id}', 'cancelled')">Cancel</button>
        <button onclick="deleteOrder('${order.id}')">Delete</button>
      </td>
    `;

    ordersBody.appendChild(row);
  });

  updateChart(data);
}

async function updateStatus(id, status) {
  const { error } = await supabaseClient
    .from("snack_orders")
    .update({ status })
    .eq("id", id);

  if (error) {
    console.error(error);
    showBubble("Status update failed");
    return;
  }

  showBubble("Status updated");
  loadOrders();
}

async function deleteOrder(id) {
  const { error } = await supabaseClient
    .from("snack_orders")
    .delete()
    .eq("id", id);

  if (error) {
    console.error(error);
    showBubble("Delete failed");
    return;
  }

  showBubble("Order deleted");
  loadOrders();
}

function updateChart(data) {
  const ctx = document.getElementById("ordersChart");

  const statusCounts = data.reduce((acc, o) => {
    acc[o.status] = (acc[o.status] || 0) + 1;
    return acc;
  }, {});

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: "doughnut",
    data: {
      labels: Object.keys(statusCounts),
      datasets: [
        {
          data: Object.values(statusCounts),
          backgroundColor: ["#60a5fa", "#34d399", "#fbbf24", "#ef4444", "#9ca3af"],
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          position: "bottom",
        },
      },
    },
  });
}

loadOrders();
