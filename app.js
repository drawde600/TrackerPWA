// app.js - v0.7

// ✅ Check if Supabase is available in global scope
if (typeof supabase === 'undefined') {
  console.error("❌ Supabase library not loaded. Make sure supabase-js is loaded before this script.");
} else {
  console.log("✅ Supabase library loaded successfully as global 'supabase' object.");
  initializeApp();
}

  // Main application initialization
function initializeApp() {
  console.log("🚀 Initializing application...");
  
  // Initialize Supabase client
  const supabaseUrl = 'https://bguwiprkgcxrqauztmvd.supabase.co';
  const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJndXdpcHJrZ2N4cnFhdXp0bXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA3ODAxOTksImV4cCI6MjA1NjM1NjE5OX0.ATbtMPiPt8VvtyVBu-gpmDo8Mo1eWy1aFXKfb6m1QsE';
  
  // Create Supabase client using the global supabase object
  const client = supabase.createClient(supabaseUrl, supabaseKey);
  console.log("✅ Supabase client initialized:", client);
  
  // Create a valid UUID for user ID (RFC4122 compliant)
  // This is a simple UUID v4 generation function
  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, 
            v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  
  // Use a valid UUID for the user ID since the column is UUID type
  const userId = generateUUID();
  console.log("Generated UUID for user:", userId);
  
  let rowCounter = 1; // Local counter for display
  
  // Fetch data and set up row addition
  fetchStoredData();
  scheduleRowAddition();
  
  // ✅ Retrieve stored data from Supabase and populate the table
  async function fetchStoredData() {
    try {
      console.log("📥 Fetching stored location data...");
      const { data, error } = await client
        .from('locations')
        .select('*')
        .order('timestamp', { ascending: true });

      if (error) {
        throw error;
      }
      
      console.log(`✅ Retrieved ${data.length} records from database`);
      
      data.forEach(row => {
        appendRow(row.latitude, row.longitude, row.elevation, row.timestamp, row.userid, row.locationid);
      });
      
      rowCounter = data.length + 1; // Adjust row counter
    } catch (error) {
      console.error("❌ Error retrieving data from Supabase:", error);
    }
  }

  // ✅ Append a row to the table with six columns
  function appendRow(latitude, longitude, altitude, timestamp, userid, locationid) {
    const tbody = document.querySelector('table tbody');
    const tr = document.createElement('tr');

    const cellLocationId = document.createElement('td');
    cellLocationId.textContent = locationid || rowCounter;

    const cellUserId = document.createElement('td');
    cellUserId.textContent = userid || userId;

    const cellTimestamp = document.createElement('td');
    cellTimestamp.textContent = timestamp;

    const cellLongitude = document.createElement('td');
    cellLongitude.textContent = longitude;

    const cellLatitude = document.createElement('td');
    cellLatitude.textContent = latitude;

    const cellElevation = document.createElement('td');
    cellElevation.textContent = (altitude !== null && altitude !== undefined) ? altitude + " m" : "N/A";

    tr.appendChild(cellLocationId);
    tr.appendChild(cellUserId);
    tr.appendChild(cellTimestamp);
    tr.appendChild(cellLongitude);
    tr.appendChild(cellLatitude);
    tr.appendChild(cellElevation);
    tbody.appendChild(tr);

    console.log("✅ Row Added:", { locationid, userid, timestamp, longitude, latitude, elevation: altitude });

    if (!locationid) {
      rowCounter++;
    }
  }

  // ✅ Store a new row in Supabase
  async function storeRowData(timestamp, userid, latitude, longitude, altitude) {
    try {
      // Handle invalid values - Convert "N/A" to null before inserting
      const validLatitude = latitude === "N/A" ? null : latitude;
      const validLongitude = longitude === "N/A" ? null : longitude;
      const validElevation = altitude === "N/A" ? null : altitude;
      
      // Ensure data types match what Supabase expects
      const dataToInsert = { 
        userid: userid, // uuid type in Supabase (should be a valid UUID)
        timestamp: timestamp, // timestamptz type in Supabase
        latitude: validLatitude, // numeric type in Supabase 
        longitude: validLongitude, // numeric type in Supabase
        elevation: validElevation // numeric type in Supabase
      };
      
      // Log the data we're trying to insert for debugging
      console.log("Attempting to insert data:", dataToInsert);
      
      // Insert data with proper error handling
      const { data, error } = await client
        .from('locations')
        .insert([dataToInsert]);

      if (error) {
        console.error("❌ Insert error details:", error);
        throw error;
      }
      
      console.log("✅ Data stored in Supabase successfully");
      
      // Optionally refresh the displayed data after insertion
      // fetchStoredData();
      
    } catch (error) {
      console.error("❌ Error storing data to Supabase:", error.message);
      // If there's a more detailed error object, log it
      if (error.details || error.hint || error.code) {
        console.error("Error details:", {
          details: error.details,
          hint: error.hint,
          code: error.code
        });
      }
    }
  }

  // ✅ Schedule adding a new row at the start of the next minute
  function scheduleRowAddition() {
    const now = new Date();
    const seconds = now.getSeconds();
    const delay = (60 - seconds) * 1000;
    
    console.log(`⏱️ Scheduling first row addition in ${delay/1000} seconds`);
    
    setTimeout(() => {
      addRow();
      setInterval(addRow, 60000); // Then every minute
    }, delay);
  }

  // ✅ Add a new row using the device's location data
  function addRow() {
    const now = new Date();
    // Use ISO format for PostgreSQL timestamptz compatibility
    const timestamp = now.toISOString();
    const displayTimestamp = now.toLocaleString(); // For display only

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        function (position) {
          // Convert to numbers for numeric column types
          const latitude = parseFloat(position.coords.latitude);
          const longitude = parseFloat(position.coords.longitude);
          const altitude = position.coords.altitude ? parseFloat(position.coords.altitude) : null;
          
          // Use formatted values for display
          const displayLatitude = latitude.toFixed(4);
          const displayLongitude = longitude.toFixed(4);
          const displayAltitude = altitude !== null ? altitude.toFixed(2) : null;
          
          appendRow(displayLatitude, displayLongitude, displayAltitude, displayTimestamp, userId);
          storeRowData(timestamp, userId, latitude, longitude, altitude);
        },
        function (error) {
          console.error("❌ Error obtaining location:", error);
          appendRow("N/A", "N/A", "N/A", displayTimestamp, userId);
          // Don't try to store invalid data
          console.error("❌ Skipping data storage due to geolocation error");
        },
        { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
      );
    } else {
      console.error("❌ Geolocation is not supported by this browser");
      appendRow("N/A", "N/A", "N/A", displayTimestamp, userId);
      console.error("❌ Skipping data storage due to lack of geolocation support");
    }
  }
}