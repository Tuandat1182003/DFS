class GraphHillClimbing {
  constructor() {
    this.adjList = new Map(); // Adjacency list to represent the graph
    this.nodes = new Set(); // Set to keep track of all nodes in the graph
    this.heuristics = new Map(); // Map to store heuristic values for vertices
    this.hillClimbingResult = [];
    this.path = "";
  }

  // Method to add a vertex with its heuristic value to the graph
  addVertex(vertex, heuristic) {
    this.nodes.add(vertex); // Add vertex to the set of nodes
    this.heuristics.set(vertex, heuristic); // Associate the heuristic with the vertex
    this.adjList.set(vertex, []); // Initialize an empty array for the vertex's neighbors
  }

  // Method to add an edge between two vertices
  addEdge(source, target) {
    // Initialize an empty array for the source vertex if it doesn't exist in the adjacency list
    if (!this.adjList.has(source)) {
      this.adjList.set(source, []);
    }
    // Add the target vertex to the adjacency list of the source vertex
    this.adjList.get(source).push(target);
  }

  // Hill Climbing algorithm
  hillClimbing(start, goal) {
    let current = start;
    const path = [{ node: start, heuristic: 0, isGoal: false }];
    const visited = new Set(); // To track visited nodes

    while (current !== goal) {
      let nextNode = null;
      let minHeuristic = Infinity;

      // Mark the current node as visited
      visited.add(current);

      // Find all neighboring nodes of the current node
      const neighbors = this.adjList.get(current) || [];

      // Traverse through the neighboring nodes and choose the node with the smallest heuristic value
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const nodeHeuristic = this.heuristics.get(neighbor) || 0; // Get heuristic value associated with the node
          if (nodeHeuristic < minHeuristic) {
            minHeuristic = nodeHeuristic;
            nextNode = neighbor;
          }
        }
      }

      // If no next node is found, break the algorithm
      if (!nextNode) break;

      // Add the next node to the path and update the current node
      current = nextNode;
      path.push({ node: current, heuristic: minHeuristic, isGoal: current === goal });
    }

    // Assign the path to the path attribute of the class
    this.path = path.map(step => step.node).join("-> ");

    return path;
  }

   // Function to sort adjacency list by weight
  sortAdjacencyList(adjacencyList, vertexWeights) {
    return adjacencyList.sort((a, b) => vertexWeights[a] - vertexWeights[b]);
  }

  // Function to calculate the maximum width for each column
  calculateColumnWidths(rows) {
    const columnWidths = Array.from({ length: rows[0].children.length }, () => 0);

    rows.forEach(row => {
      Array.from(row.children).forEach((cell, index) => {
        columnWidths[index] = Math.max(columnWidths[index], cell.innerText.length);
      });
    });

    return columnWidths;
  }

  // to export table data to TXT file
  exportTableToTXT(filename) {
    const rows = Array.from(document.querySelectorAll('#HillClimbTable tbody tr'));
    const txtData = [];

    // Push column names
    txtData.push('Expanded Node\tAdjacency List\tList L1\t\tList L');

    // Loop through rows
    rows.forEach(row => {
      const rowData = [];
      const expandedNode = row.children[0].innerText;
      const listLCell = row.children[3];
      const listLNodes = listLCell.innerText.split(',');

      // Filter out nodes present in the Expanded Node column
      const filteredListLNodes = listLNodes.filter(node => !expandedNode.includes(node.split(/[0-9]/)[0]));

      // Reconstruct the List L column
      const reconstructedListL = filteredListLNodes.join(',');

      // Add extra spaces to make columns straighter
      rowData.push(row.children[0].innerText.padEnd(20, ' '));
      rowData.push(row.children[1].innerText.padEnd(20, ' '));
      rowData.push(row.children[2].innerText.padEnd(20, ' '));
      rowData.push(reconstructedListL.padEnd(20, ' '));

      txtData.push(rowData.join('\t'));
    });

    // Create TXT content
    const txtContent = txtData.join('\n');

    // Create a download link and trigger click event
    const encodedUri = encodeURI('data:text/plain;charset=utf-8,' + txtContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link); // Required for Firefox
    link.click();
  }

  // Hill climbing algorithm
  drawTable(initialState, goalState, vertexWeights ,edges) {
    let currentNode = initialState;
    const tableBody = document.getElementById('HillClimbTableBody');
    let prevListL = ''; // Track previous List L
    const visited = new Set(); // Track visited nodes
    let listExpandedNodes = [];

    while (currentNode !== goalState) {
      if(currentNode !== initialState) {
        listExpandedNodes.push(`${currentNode}${vertexWeights[currentNode]}`);
      }

      let listExpandedNodesString = listExpandedNodes.join(',')
      visited.add(currentNode); // Mark current node as visited

      const adjacencyList = edges.filter(edge => edge.source === currentNode && !visited.has(edge.target));
      const sortedAdjacencyList = this.sortAdjacencyList(adjacencyList.map(edge => edge.target), vertexWeights);

      const newRow = document.createElement('tr');
      const listL = sortedAdjacencyList
        .filter(vertex => !prevListL.includes(vertex)) // Remove nodes already in prevListL
        .map(vertex => vertex + vertexWeights[vertex])
        .join(',');

      newRow.innerHTML = `
          <td>${currentNode}${vertexWeights[currentNode]}</td>
          <td>${adjacencyList.map(edge => edge.target + vertexWeights[edge.target]).join(',')}</td>
          <td>${sortedAdjacencyList.map(vertex => vertex + vertexWeights[vertex]).join(',')}</td>
          <td>${prevListL ? (listL + ',' + prevListL).replace(listExpandedNodesString, '') : listL}</td>
      `;
      tableBody.appendChild(newRow);

      prevListL = prevListL ? (prevListL + ',' + listL) : listL; // Merge with previous List L
      currentNode = sortedAdjacencyList[0];
    }

    // Add the goal state row
    const goalRow = document.createElement('tr');
    goalRow.innerHTML = `
      <td>${goalState}${vertexWeights[goalState]}</td>
      <td>Stop</td>
      <td></td>
      <td></td> 
  `;
    tableBody.appendChild(goalRow);
  }

  drawGraph(vertices, edges) {
    // Create an SVG container
    const svg = d3.select('#graph-container');
  
    // Set width and height of SVG container
    const width = 1300;
    const height = 600;
    svg.attr('width', width)
        .attr('height', height);
  
    // Create a group for the graph elements
    const graph = svg.append('g');
  
    // Create links
    const links = graph.selectAll('.link')
        .data(edges)
        .enter().append('line')
        .attr('class', 'link');
  
    // Create nodes
    const nodeElements = graph.selectAll('.node')
        .data(vertices)
        .enter().append('circle')
        .attr('class', 'node')
        .attr('r', d => 15); // Increased node size
  
    // Create labels for nodes
    const labels = graph.selectAll('.label')
        .data(vertices)
        .enter().append('text')
        .attr('class', 'label')
        .text(d => d.id)
        .attr('text-anchor', 'middle')
        .attr('dy', -6); // Adjust vertical position
  
    // Create weight labels for nodes
    const weightLabels = graph.selectAll('.weight')
        .data(vertices)
        .enter().append('text')
        .attr('class', 'weight')
        .text(d => d.weight)
        .attr('text-anchor', 'middle')
        .attr('dy', 10); // Adjust vertical position
  
    // Initialize the D3 force-directed graph simulation
    const simulation = d3.forceSimulation(vertices)
        .force('link', d3.forceLink(edges).id(d => d.id).strength(0.05)) // Decreased link strength
        .force('charge', d3.forceManyBody())
        .force('center', d3.forceCenter(width / 2, height / 2));
  
    // Update node and link positions during simulation
    simulation.on('tick', () => {
        links
            .attr('x1', d => d.source.x)
            .attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x)
            .attr('y2', d => d.target.y);
  
        nodeElements
            .attr('cx', d => d.x)
            .attr('cy', d => d.y);
  
        labels
            .attr('x', d => d.x)
            .attr('y', d => d.y); // Positioned slightly above the node center
  
        weightLabels
            .attr('x', d => d.x)
            .attr('y', d => d.y); // Positioned slightly above the node center
    });
  
    // Apply a scale transform to make the graph larger
    svg.attr('transform', 'scale(1.5)');
  
    let getGraph = document.querySelector(".graph");
    getGraph.style.display = "block";
}


}
