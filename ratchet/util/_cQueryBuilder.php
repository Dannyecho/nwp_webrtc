<?php

class QueryBuilder
{
    protected $connection;
    protected $table;
    protected $columns = ['*'];
    protected $where = [];
    protected $orderBy = [];
    protected $limit;
    protected $offset;
    protected $bindings = [];

    public function __construct(PDO $connection)
    {
        $this->connection = $connection;
    }

    public function query(string $table): self
    {
        $this->table = $table;
        return $this;
    }

    public function select(array $columns = ['*']): self
    {
        $this->columns = $columns;
        return $this;
    }

    public function where(string $column, string $operator, $value): self
    {
        $this->where[] = compact('column', 'operator', 'value');
        $this->bindings[] = $value;
        return $this;
    }

    public function orderBy(string $column, string $direction = 'asc'): self
    {
        $this->orderBy[] = [$column, $direction];
        return $this;
    }

    public function limit(int $limit): self
    {
        $this->limit = $limit;
        return $this;
    }

    public function offset(int $offset): self
    {
        $this->offset = $offset;
        return $this;
    }

    public function insert(array $data): self
    {
        $columns = array_keys($data);
        $placeholders = implode(', ', array_fill(0, count($data), '?'));
        $sql = "INSERT INTO {$this->table} (" . implode(', ', $columns) . ") VALUES (" . $placeholders . ")";
        $this->bindings = array_values($data);

        $stmt = $this->connection->prepare($sql);
        $stmt->execute($this->bindings);

        return $this;
    }

    public function get(): array
    {
        $sql = $this->buildSelectSql();
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($this->bindings);
        return $stmt->fetchAll(PDO::FETCH_ASSOC);
    }

    public function first(): ?array
    {
        $this->limit(1);
        $results = $this->get();
        return count($results) > 0 ? $results[0] : null;
    }

    protected function buildSelectSql(): string
    {
        $sql = "SELECT " . implode(', ', $this->columns) . " FROM " . $this->table;

        if (!empty($this->where)) {
            $whereClauses = [];
            foreach ($this->where as $key => $condition) {
                $whereClauses[] = "`{$condition['column']}` {$condition['operator']} ?"; 
            }
            $sql .= " WHERE " . implode(' AND ', $whereClauses);
        }

        if (!empty($this->orderBy)) {
            $orderByClauses = [];
            foreach ($this->orderBy as $order) {
                $orderByClauses[] = "`{$order[0]}` {$order[1]}";
            }
            $sql .= " ORDER BY " . implode(', ', $orderByClauses);
        }

        if ($this->limit !== null) {
            $sql .= " LIMIT " . $this->limit;
        }

        if ($this->offset !== null) {
            $sql .= " OFFSET " . $this->offset;
        }

        return $sql;
    }
}