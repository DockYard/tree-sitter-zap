/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGN: 1,
  TYPE_ANN: 2,
  OR: 3,
  AND: 4,
  COMPARE: 5,
  PIPE: 6,
  CONCAT: 7,
  ADD: 8,
  MULT: 9,
  UNARY: 10,
  UNWRAP: 11,
  CALL: 12,
  ACCESS: 13,
};

module.exports = grammar({
  name: "zap",

  extras: ($) => [/\s/, $.comment],

  word: ($) => $.identifier,

  conflicts: ($) => [
    [$.type_expression, $.union_type],
    [$._pattern_expr, $._expression],
  ],

  rules: {
    source_file: ($) => repeat($._top_level),

    _top_level: ($) =>
      choice(
        $.module_definition,
        $.function_definition,
        $.private_function_definition,
        $.macro_definition,
        $.struct_definition,
        $.enum_definition,
        $.type_declaration,
        $.opaque_declaration,
        $.import_statement,
        $.alias_statement,
      ),

    // ── Comments ──────────────────────────────────────────────────
    // Low precedence so string_content (prec 1) and string_interpolation win inside strings
    comment: ($) => token(prec(-2, seq("#", /[^\n]*/))),

    // ── Module definition ─────────────────────────────────────────
    module_definition: ($) =>
      seq(
        "defmodule",
        field("name", $.module_path),
        optional(seq("extends", field("parent", $.module_path))),
        "do",
        repeat($._module_member),
        "end",
      ),

    _module_member: ($) =>
      choice(
        $.function_definition,
        $.private_function_definition,
        $.macro_definition,
        $.struct_definition,
        $.enum_definition,
        $.type_declaration,
        $.opaque_declaration,
        $.import_statement,
        $.alias_statement,
      ),

    // ── Function definitions ──────────────────────────────────────
    function_definition: ($) =>
      seq(
        "def",
        field("name", $.identifier),
        "(",
        optional($.parameter_list),
        ")",
        optional(seq("::", field("return_type", $.type_expression))),
        optional(seq("if", field("guard", $._expression))),
        "do",
        field("body", optional($.body)),
        "end",
      ),

    private_function_definition: ($) =>
      seq(
        "defp",
        field("name", $.identifier),
        "(",
        optional($.parameter_list),
        ")",
        optional(seq("::", field("return_type", $.type_expression))),
        optional(seq("if", field("guard", $._expression))),
        "do",
        field("body", optional($.body)),
        "end",
      ),

    macro_definition: ($) =>
      seq(
        "defmacro",
        field("name", $.identifier),
        "(",
        optional($.parameter_list),
        ")",
        optional(seq("::", field("return_type", $.type_expression))),
        "do",
        field("body", optional($.body)),
        "end",
      ),

    body: ($) => repeat1($._expression),

    parameter_list: ($) => commaSep1($.parameter),

    parameter: ($) =>
      seq(
        field("name", $._pattern_expr),
        optional(seq("::", field("type", $.type_expression))),
        optional(seq("=", field("default", $._expression))),
      ),

    // Restricted expression for patterns - no assignment, no type annotation
    _pattern_expr: ($) =>
      choice(
        $._primary,
        prec(PREC.UNARY, seq(choice("-", "not"), $._pattern_expr)),
      ),

    // ── Struct definitions ────────────────────────────────────────
    struct_definition: ($) =>
      seq(
        "defstruct",
        field("name", $.module_name),
        optional(seq("extends", field("parent", $.module_path))),
        "do",
        repeat($.struct_field),
        "end",
      ),

    struct_field: ($) =>
      seq(
        field("name", $.identifier),
        "::",
        field("type", $.type_expression),
        optional(seq("=", field("default", $._expression))),
      ),

    // ── Enum definitions ──────────────────────────────────────────
    enum_definition: ($) =>
      seq(
        "defenum",
        field("name", $.module_name),
        "do",
        repeat($.enum_variant),
        "end",
      ),

    enum_variant: ($) => $.module_name,

    // ── Type declarations ─────────────────────────────────────────
    type_declaration: ($) =>
      seq(
        "type",
        field("name", $.module_name),
        optional(seq("(", commaSep1($.type_variable), ")")),
        "=",
        field("type", $.type_expression),
      ),

    opaque_declaration: ($) =>
      seq(
        "opaque",
        field("name", $.module_name),
        "=",
        field("type", $.type_expression),
      ),

    // ── Import and alias ──────────────────────────────────────────
    import_statement: ($) =>
      seq(
        "import",
        field("module", $.module_path),
        optional(
          seq(
            ",",
            choice(
              seq("only:", "[", commaSep1($.import_entry), "]"),
              seq("except:", "[", commaSep1($.import_entry), "]"),
            ),
          ),
        ),
      ),

    import_entry: ($) => seq($.identifier, ":", $.integer),

    alias_statement: ($) =>
      seq(
        "alias",
        field("module", $.module_path),
        optional(seq(",", "as:", field("alias", $.module_name))),
      ),

    // ── Types ─────────────────────────────────────────────────────
    type_expression: ($) =>
      choice($.union_type, $._type_primary),

    union_type: ($) =>
      prec.left(seq($._type_primary, repeat1(seq("|", $._type_primary)))),

    _type_primary: ($) =>
      choice(
        $.type_name,
        $.type_variable,
        $.parameterized_type,
        $.user_type,
        $.tuple_type,
        $.list_type,
        $.map_type,
        $.function_type,
        $.literal_type,
        seq("(", $.type_expression, ")"),
      ),

    type_name: ($) =>
      choice(
        "i8", "i16", "i32", "i64",
        "u8", "u16", "u32", "u64",
        "f16", "f32", "f64",
        "isize", "usize",
        "Bool", "String", "Atom", "Nil", "Never",
      ),

    type_variable: ($) => $.identifier,

    user_type: ($) => $.module_path,

    parameterized_type: ($) =>
      prec(1, seq($.module_name, "(", commaSep1($.type_expression), ")")),

    tuple_type: ($) => seq("{", commaSep1($.type_expression), "}"),

    list_type: ($) => seq("[", $.type_expression, "]"),

    map_type: ($) => seq("%{", $.type_expression, "=>", $.type_expression, "}"),

    function_type: ($) =>
      seq("(", optional(seq(commaSep1($.type_expression), ",")), "->", $.type_expression, ")"),

    literal_type: ($) =>
      choice($.integer, $.float, $.string, "true", "false", "nil"),

    // ── Expressions ───────────────────────────────────────────────
    _expression: ($) =>
      choice(
        $._primary,
        $.binary_expression,
        $.unary_expression,
        $.pipe_expression,
        $.unwrap_expression,
        $.type_annotation,
        $.assignment,
      ),

    assignment: ($) =>
      prec.right(PREC.ASSIGN, seq($._expression, "=", $._expression)),

    type_annotation: ($) =>
      prec.left(PREC.TYPE_ANN, seq($._expression, "::", field("type", $.type_expression))),

    binary_expression: ($) =>
      choice(
        prec.left(PREC.OR, seq($._expression, "or", $._expression)),
        prec.left(PREC.AND, seq($._expression, "and", $._expression)),
        prec.left(PREC.COMPARE, seq($._expression, $.comparison_operator, $._expression)),
        prec.left(PREC.ADD, seq($._expression, $.additive_operator, $._expression)),
        prec.left(PREC.CONCAT, seq($._expression, "<>", $._expression)),
        prec.left(PREC.MULT, seq($._expression, $.multiplicative_operator, $._expression)),
      ),

    comparison_operator: ($) => choice("==", "!=", "<", ">", "<=", ">="),
    additive_operator: ($) => choice("+", "-"),
    multiplicative_operator: ($) => choice("*", "/", "rem"),

    unary_expression: ($) =>
      prec(PREC.UNARY, seq(choice("-", "not"), $._expression)),

    pipe_expression: ($) =>
      prec.left(PREC.PIPE, seq($._expression, "|>", $._expression)),

    unwrap_expression: ($) =>
      prec.left(PREC.UNWRAP, seq($._expression, token.immediate("!"))),

    _primary: ($) =>
      choice(
        $.identifier,
        $.module_access,
        $.integer,
        $.float,
        $.string,
        $.atom,
        $.boolean,
        $.nil,
        $.wildcard,
        $.pin_expression,
        $.tuple,
        $.list,
        $.map_literal,
        $.binary_literal,
        $.function_call,
        $.qualified_call,
        $.field_access,
        $.if_expression,
        $.case_expression,
        $.cond_expression,
        $.with_expression,
        $.quote_expression,
        $.unquote_expression,
        $.panic_expression,
        $.paren_expression,
      ),

    paren_expression: ($) => seq("(", $._expression, ")"),

    // Pattern-specific constructs (also valid expressions)
    wildcard: ($) => "_",
    pin_expression: ($) => seq("^", $.identifier),

    // ── Literals ──────────────────────────────────────────────────
    integer: ($) =>
      token(choice(
        /[0-9][0-9_]*/,
        seq("0x", /[0-9a-fA-F][0-9a-fA-F_]*/),
        seq("0b", /[01][01_]*/),
        seq("0o", /[0-7][0-7_]*/),
      )),

    float: ($) => token(/[0-9][0-9_]*\.[0-9][0-9_]*/),

    string: ($) =>
      seq(
        '"',
        repeat(choice($.string_content, $.escape_sequence, $.string_interpolation)),
        '"',
      ),

    string_content: ($) => token.immediate(prec(1, /[^"\\#]+|#[^{]/)),
    escape_sequence: ($) => token.immediate(seq("\\", /./)),
    string_interpolation: ($) => seq(token.immediate("#{"), $._expression, "}"),

    atom: ($) => token(seq(":", /[a-zA-Z_][a-zA-Z0-9_]*[!?]?/)),

    boolean: ($) => choice("true", "false"),
    nil: ($) => "nil",

    // ── Compound literals ─────────────────────────────────────────
    tuple: ($) => seq("{", commaSep1($._expression), "}"),

    list: ($) =>
      seq(
        "[",
        optional(choice(
          seq(commaSep1($._expression), "|", $._expression),
          commaSep1($._expression),
        )),
        "]",
      ),

    map_literal: ($) =>
      seq("%{", optional(commaSep1(choice($.map_entry, $.struct_field_value))), "}"),

    map_entry: ($) => seq($._expression, "=>", $._expression),

    struct_field_value: ($) =>
      seq(field("key", $.identifier), ":", field("value", $._expression)),

    binary_literal: ($) =>
      seq("<<", optional(commaSep1($.binary_segment)), ">>"),

    binary_segment: ($) =>
      seq($._pattern_expr, optional(seq("::", $.binary_type_spec))),

    binary_type_spec: ($) =>
      seq(
        choice($.identifier, $.module_name),
        optional(seq("-", $.binary_type_modifier)),
      ),

    binary_type_modifier: ($) =>
      seq($.identifier, optional(seq("(", $._expression, ")"))),

    // ── Function calls ────────────────────────────────────────────
    function_call: ($) =>
      prec(PREC.CALL, seq(
        field("name", $.identifier),
        token.immediate("("),
        optional($.argument_list),
        ")",
      )),

    qualified_call: ($) =>
      prec(PREC.CALL, seq(
        field("module", $.module_path),
        ".",
        field("name", $.identifier),
        token.immediate("("),
        optional($.argument_list),
        ")",
      )),

    argument_list: ($) => commaSep1($._expression),

    field_access: ($) =>
      prec.left(PREC.ACCESS, seq($._expression, ".", field("field", $.identifier))),

    module_access: ($) =>
      prec(PREC.ACCESS, seq($.module_path, ".", $.module_name)),

    // ── Control flow ──────────────────────────────────────────────
    if_expression: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        "do",
        field("then", optional($.body)),
        optional(seq("else", field("else", optional($.body)))),
        "end",
      ),

    case_expression: ($) =>
      seq(
        "case",
        field("subject", $._expression),
        "do",
        repeat1($.case_clause),
        "end",
      ),

    case_clause: ($) =>
      seq(
        field("pattern", $._expression),
        optional(seq("when", field("guard", $._expression))),
        "->",
        field("body", $._expression),
      ),

    cond_expression: ($) =>
      seq("cond", "do", repeat1($.cond_clause), "end"),

    cond_clause: ($) =>
      seq(field("condition", $._expression), "->", field("body", $._expression)),

    with_expression: ($) =>
      seq(
        "with",
        commaSep1($.with_clause),
        "do",
        field("body", $.body),
        optional(seq("else", repeat1($.case_clause))),
        "end",
      ),

    with_clause: ($) =>
      seq($._expression, "<-", $._expression),

    // ── Quote / Unquote ───────────────────────────────────────────
    quote_expression: ($) =>
      seq("quote", "do", optional($.body), "end"),

    unquote_expression: ($) =>
      seq("unquote", "(", $._expression, ")"),

    // ── Panic ─────────────────────────────────────────────────────
    panic_expression: ($) =>
      seq("panic", "(", $._expression, ")"),

    // ── Identifiers ───────────────────────────────────────────────
    identifier: ($) => /[a-z_][a-zA-Z0-9_]*[!?]?/,
    module_name: ($) => /[A-Z][a-zA-Z0-9]*/,
    module_path: ($) =>
      prec.left(seq($.module_name, repeat(seq(".", $.module_name)))),
  },
});

function commaSep1(rule) {
  return seq(rule, repeat(seq(",", rule)));
}
