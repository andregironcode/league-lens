import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Database Connection');
console.log('='.repeat(50));
console.log('📋 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT FOUND');
console.log('🔑 Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  
  try {
    // Test basic connection with simple select
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('Current data:', data);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testInsertOperation() {
  console.log('\n📝 Testing Insert Operation...');
  
  try {
    // Try to insert a test league
    const { data, error } = await supabase
      .from('leagues')
      .upsert({
        id: 99999,
        name: 'Test League',
        country: 'Test Country',
        logo: 'test.png',
        season: 2024
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error);
      console.log('Full error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Insert successful!');
    console.log('Inserted data:', data);
    
    // Clean up test data
    const { error: deleteError } = await supabase.from('leagues').delete().eq('id', 99999);
    if (deleteError) {
      console.log('⚠️ Cleanup error:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Insert operation failed:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n🏗️ Checking Table Structure...');
  
  try {
    // Check if tables exist by trying to select from them
    const tables = ['leagues', 'teams', 'matches', 'highlights'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed:`, err.message);
      }
    }
  } catch (error) {
    console.log('❌ Table structure check failed:', error.message);
  }
}

async function runDatabaseDebug() {
  console.log('\n🚀 Starting Database Debug Session');
  
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n💥 Database connection failed - stopping debug');
    return;
  }
  
  await checkTableStructure();
  await testInsertOperation();
  
  console.log('\n🎯 Debug session completed!');
}

runDatabaseDebug(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Database Connection');
console.log('='.repeat(50));
console.log('📋 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT FOUND');
console.log('🔑 Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  
  try {
    // Test basic connection with simple select
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('Current data:', data);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testInsertOperation() {
  console.log('\n📝 Testing Insert Operation...');
  
  try {
    // Try to insert a test league
    const { data, error } = await supabase
      .from('leagues')
      .upsert({
        id: 99999,
        name: 'Test League',
        country: 'Test Country',
        logo: 'test.png',
        season: 2024
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error);
      console.log('Full error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Insert successful!');
    console.log('Inserted data:', data);
    
    // Clean up test data
    const { error: deleteError } = await supabase.from('leagues').delete().eq('id', 99999);
    if (deleteError) {
      console.log('⚠️ Cleanup error:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Insert operation failed:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n🏗️ Checking Table Structure...');
  
  try {
    // Check if tables exist by trying to select from them
    const tables = ['leagues', 'teams', 'matches', 'highlights'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed:`, err.message);
      }
    }
  } catch (error) {
    console.log('❌ Table structure check failed:', error.message);
  }
}

async function runDatabaseDebug() {
  console.log('\n🚀 Starting Database Debug Session');
  
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n💥 Database connection failed - stopping debug');
    return;
  }
  
  await checkTableStructure();
  await testInsertOperation();
  
  console.log('\n🎯 Debug session completed!');
}

runDatabaseDebug(); 
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// Supabase configuration
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 Debugging Database Connection');
console.log('='.repeat(50));
console.log('📋 Supabase URL:', supabaseUrl ? `${supabaseUrl.substring(0, 30)}...` : 'NOT FOUND');
console.log('🔑 Supabase Key:', supabaseKey ? `${supabaseKey.substring(0, 20)}...` : 'NOT FOUND');

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Missing Supabase credentials!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabaseConnection() {
  console.log('\n🔌 Testing Database Connection...');
  
  try {
    // Test basic connection with simple select
    const { data, error } = await supabase
      .from('leagues')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ Database connection error:', error);
      return false;
    }
    
    console.log('✅ Database connection successful!');
    console.log('Current data:', data);
    return true;
  } catch (error) {
    console.log('❌ Database connection failed:', error.message);
    return false;
  }
}

async function testInsertOperation() {
  console.log('\n📝 Testing Insert Operation...');
  
  try {
    // Try to insert a test league
    const { data, error } = await supabase
      .from('leagues')
      .upsert({
        id: 99999,
        name: 'Test League',
        country: 'Test Country',
        logo: 'test.png',
        season: 2024
      })
      .select();
    
    if (error) {
      console.log('❌ Insert error:', error);
      console.log('Full error details:', JSON.stringify(error, null, 2));
      return false;
    }
    
    console.log('✅ Insert successful!');
    console.log('Inserted data:', data);
    
    // Clean up test data
    const { error: deleteError } = await supabase.from('leagues').delete().eq('id', 99999);
    if (deleteError) {
      console.log('⚠️ Cleanup error:', deleteError);
    } else {
      console.log('✅ Test data cleaned up');
    }
    
    return true;
  } catch (error) {
    console.log('❌ Insert operation failed:', error.message);
    return false;
  }
}

async function checkTableStructure() {
  console.log('\n🏗️ Checking Table Structure...');
  
  try {
    // Check if tables exist by trying to select from them
    const tables = ['leagues', 'teams', 'matches', 'highlights'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table '${table}' error:`, error.message);
        } else {
          console.log(`✅ Table '${table}' exists and accessible`);
        }
      } catch (err) {
        console.log(`❌ Table '${table}' check failed:`, err.message);
      }
    }
  } catch (error) {
    console.log('❌ Table structure check failed:', error.message);
  }
}

async function runDatabaseDebug() {
  console.log('\n🚀 Starting Database Debug Session');
  
  const connectionOk = await testDatabaseConnection();
  if (!connectionOk) {
    console.log('\n💥 Database connection failed - stopping debug');
    return;
  }
  
  await checkTableStructure();
  await testInsertOperation();
  
  console.log('\n🎯 Debug session completed!');
}

runDatabaseDebug(); 