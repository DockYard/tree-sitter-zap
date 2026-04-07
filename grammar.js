/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
  ASSIGN: 1,
  TYPE_ANN: 2,
  OR: 3,
  AND: 4,
  COMPARE: 5,
  ERROR_PIPE: 6,
  PIPE: 7,
  CONCAT: 8,
  ADD: 9,
  MULT: 10,
  UNARY: 11,
  UNWRAP: 12,
  CALL: 13,
  ACCESS: 14,
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
        $.struct_definition,
        $.union_definition,
        $.type_declaration,
        $.opaque_declaration,
        $.import_statement,
        $.alias_statement,
      ),

    // ── Comments ──────────────────────────────────────────────────
    // Low precedence so string_content wins inside strings
    comment: ($) => token(prec(-2, seq("#", /[^\n]*/))),

    // ── Visibility ────────────────────────────────────────────────
    visibility_modifier: ($) => "pub",

    // ── Module definition ─────────────────────────────────────────
    module_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "module",
        field("name", $.module_path),
        optional(seq("extends", field("parent", $.module_path))),
        "{",
        repeat($._module_member),
        "}",
      ),

    _module_member: ($) =>
      choice(
        $.function_definition,
        $.macro_definition,
        $.struct_definition,
        $.union_definition,
        $.type_declaration,
        $.opaque_declaration,
        $.import_statement,
        $.alias_statement,
        $.use_statement,
        $.attribute_declaration,
      ),

    // ── Function definitions ──────────────────────────────────────
    function_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "fn",
        field("name", $.identifier),
        "(",
        optional($.parameter_list),
        ")",
        optional(seq("->", field("return_type", $.type_expression))),
        optional(seq("if", field("guard", $._expression))),
        "{",
        field("body", optional($.body)),
        "}",
      ),

    macro_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "macro",
        field(
          "name",
          choice(
            $.identifier,
            "if",
            "cond",
            "with",
            "and",
            "or",
            "fn",
            "struct",
            "union",
            "|>",
          ),
        ),
        "(",
        optional($.parameter_list),
        ")",
        optional(seq("->", field("return_type", $.type_expression))),
        "{",
        field("body", optional($.body)),
        "}",
      ),

    body: ($) => repeat1($._statement),

    _statement: ($) =>
      choice(
        $._expression,
        $.assignment,
        $.function_definition,
        $.macro_definition,
        $.import_statement,
      ),

    parameter_list: ($) => commaSep1($.parameter),

    parameter: ($) =>
      seq(
        field("pattern", $._pattern_expr),
        optional(
          seq(
            "::",
            optional($.ownership_modifier),
            field("type", $.type_expression),
          ),
        ),
        optional(seq("=", field("default", $._expression))),
      ),

    ownership_modifier: ($) => choice("shared", "unique", "borrowed"),

    // Restricted expression for patterns — no assignment, no type annotation
    _pattern_expr: ($) =>
      choice(
        $._primary,
        prec(PREC.UNARY, seq(choice("-", "not"), $._pattern_expr)),
      ),

    // ── Struct definitions ────────────────────────────────────────
    struct_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "struct",
        field("name", $.module_path),
        optional(seq("extends", field("parent", $.module_path))),
        "{",
        repeat(seq($.struct_field, optional(","))),
        "}",
      ),

    struct_field: ($) =>
      seq(
        field("name", $.identifier),
        "::",
        field("type", $.type_expression),
        optional(seq("=", field("default", $._expression))),
      ),

    // ── Union definitions ─────────────────────────────────────────
    union_definition: ($) =>
      seq(
        optional($.visibility_modifier),
        "union",
        field("name", $.module_name),
        "{",
        repeat(seq($.union_variant, optional(","))),
        "}",
      ),

    union_variant: ($) =>
      seq(
        field("name", $.module_name),
        optional(seq("::", field("type", $.type_expression))),
      ),

    // ── Type declarations ─────────────────────────────────────────
    type_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "type",
        field("name", $.module_name),
        optional(seq("(", commaSep1($.type_variable), ")")),
        "=",
        field("type", $.type_expression),
      ),

    opaque_declaration: ($) =>
      seq(
        optional($.visibility_modifier),
        "opaque",
        field("name", $.module_name),
        optional(seq("(", commaSep1($.type_variable), ")")),
        "=",
        field("type", $.type_expression),
      ),

    // ── Attribute declarations ────────────────────────────────────
    attribute_declaration: ($) =>
      seq(
        "@",
        field("name", $.identifier),
        optional(
          choice(
            // Typed: @name :: Type = value
            seq(
              "::",
              field("type", $.type_expression),
              "=",
              field("value", $._expression),
            ),
            // Untyped: @name = value
            seq("=", field("value", $._expression)),
          ),
        ),
      ),

    // ── Use statement ─────────────────────────────────────────────
    use_statement: ($) =>
      seq("use", field("module", $.module_path)),

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

    import_entry: ($) =>
      choice(
        seq($.identifier, ":", $.integer),
        seq("type:", choice($.identifier, $.module_name)),
      ),

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
        "i8",
        "i16",
        "i32",
        "i64",
        "u8",
        "u16",
        "u32",
        "u64",
        "f16",
        "f32",
        "f64",
        "isize",
        "usize",
        "Bool",
        "String",
        "Atom",
        "Nil",
        "Never",
      ),

    type_variable: ($) => $.identifier,

    user_type: ($) => $.module_path,

    parameterized_type: ($) =>
      prec(1, seq($.module_name, "(", commaSep1($.type_expression), ")")),

    tuple_type: ($) => seq("{", commaSep1($.type_expression), "}"),

    list_type: ($) => seq("[", $.type_expression, "]"),

    map_type: ($) =>
      seq("%{", $.type_expression, "=>", $.type_expression, "}"),

    function_type: ($) =>
      seq(
        "(",
        optional(seq(commaSep1($.type_expression), ",")),
        "->",
        $.type_expression,
        ")",
      ),

    literal_type: ($) =>
      choice($.integer, $.float, $.string, $.heredoc, "true", "false", "nil"),

    // ── Expressions ───────────────────────────────────────────────
    _expression: ($) =>
      choice(
        $._primary,
        $.binary_expression,
        $.unary_expression,
        $.pipe_expression,
        $.error_pipe_expression,
        $.unwrap_expression,
        $.type_annotation,
      ),

    assignment: ($) =>
      prec.right(PREC.ASSIGN, seq($._expression, "=", $._expression)),

    type_annotation: ($) =>
      prec.left(
        PREC.TYPE_ANN,
        seq($._expression, "::", field("type", $.type_expression)),
      ),

    binary_expression: ($) =>
      choice(
        prec.left(PREC.OR, seq($._expression, "or", $._expression)),
        prec.left(PREC.AND, seq($._expression, "and", $._expression)),
        prec.left(
          PREC.COMPARE,
          seq($._expression, $.comparison_operator, $._expression),
        ),
        prec.left(
          PREC.ADD,
          seq($._expression, $.additive_operator, $._expression),
        ),
        prec.left(PREC.CONCAT, seq($._expression, "<>", $._expression)),
        prec.left(
          PREC.MULT,
          seq($._expression, $.multiplicative_operator, $._expression),
        ),
      ),

    comparison_operator: ($) => choice("==", "!=", "<", ">", "<=", ">="),
    additive_operator: ($) => choice("+", "-"),
    multiplicative_operator: ($) => choice("*", "/", "rem"),

    unary_expression: ($) =>
      prec(PREC.UNARY, seq(choice("-", "not"), $._expression)),

    pipe_expression: ($) =>
      prec.left(PREC.PIPE, seq($._expression, "|>", $._expression)),

    error_pipe_expression: ($) =>
      prec.left(
        PREC.ERROR_PIPE,
        seq(
          $._expression,
          "~>",
          choice(
            seq("{", repeat($.case_clause), "}"),
            $._expression,
          ),
        ),
      ),

    unwrap_expression: ($) =>
      prec.left(PREC.UNWRAP, seq($._expression, token.immediate("!"))),

    _primary: ($) =>
      choice(
        $.identifier,
        $.module_access,
        $.integer,
        $.float,
        $.string,
        $.heredoc,
        $.sigil,
        $.atom,
        $.boolean,
        $.nil,
        $.wildcard,
        $.pin_expression,
        $.tuple,
        $.list,
        $.map_literal,
        $.struct_expression,
        $.binary_literal,
        $.function_call,
        $.qualified_call,
        $.field_access,
        $.function_reference,
        $.if_expression,
        $.case_expression,
        $.cond_expression,
        $.for_expression,
        $.with_expression,
        $.quote_expression,
        $.unquote_expression,
        $.unquote_splicing_expression,
        $.panic_expression,
        $.attribute_reference,
        $.intrinsic_call,
        $.paren_expression,
      ),

    paren_expression: ($) => seq("(", $._expression, ")"),

    // Pattern-specific constructs (also valid expressions)
    wildcard: ($) => "_",
    pin_expression: ($) => seq("^", $.identifier),

    // ── Literals ──────────────────────────────────────────────────
    integer: ($) =>
      token(
        choice(
          /[0-9][0-9_]*/,
          seq("0x", /[0-9a-fA-F][0-9a-fA-F_]*/),
          seq("0b", /[01][01_]*/),
          seq("0o", /[0-7][0-7_]*/),
        ),
      ),

    float: ($) => token(/[0-9][0-9_]*\.[0-9][0-9_]*/),

    string: ($) =>
      seq(
        '"',
        repeat(
          choice($.string_content, $.escape_sequence, $.string_interpolation),
        ),
        '"',
      ),

    // ── Heredoc (triple-quoted string) ────────────────────────────
    heredoc: ($) =>
      seq(
        '"""',
        repeat(
          choice(
            $.heredoc_content,
            $.escape_sequence,
            $.string_interpolation,
          ),
        ),
        '"""',
      ),

    heredoc_content: ($) => token.immediate(prec(1, /[^"\\#]+|"[^"]|""[^"]|#[^{]/)),

    string_content: ($) => token.immediate(prec(1, /[^"\\#]+|#[^{]/)),
    escape_sequence: ($) => token.immediate(seq("\\", /./)),
    string_interpolation: ($) =>
      seq(token.immediate("#{"), $._expression, "}"),

    // ── Sigil ─────────────────────────────────────────────────────
    sigil: ($) =>
      seq(
        $.sigil_name,
        choice($.string, $.heredoc),
      ),

    sigil_name: ($) => token(seq("~", /[a-zA-Z_][a-zA-Z0-9_]*/)),

    atom: ($) => token(seq(":", /[a-zA-Z_][a-zA-Z0-9_]*[!?]?/)),

    boolean: ($) => choice("true", "false"),
    nil: ($) => "nil",

    // ── Compound literals ─────────────────────────────────────────
    tuple: ($) => seq("{", commaSep1($._expression), "}"),

    list: ($) =>
      seq(
        "[",
        optional(
          choice(
            seq(commaSep1($._expression), "|", $._expression),
            commaSep1($._expression),
          ),
        ),
        "]",
      ),

    map_literal: ($) =>
      seq(
        "%{",
        optional(commaSep1(choice($.map_entry, $.struct_field_value))),
        "}",
      ),

    map_entry: ($) => seq($._expression, "=>", $._expression),

    struct_field_value: ($) =>
      seq(field("key", $.identifier), ":", field("value", $._expression)),

    struct_expression: ($) =>
      seq(
        "%",
        field("module", $.module_path),
        "{",
        optional(commaSep1($.struct_field_value)),
        "}",
      ),

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
      prec.right(
        PREC.CALL,
        seq(
          field("name", $.identifier),
          token.immediate("("),
          optional($.argument_list),
          ")",
          optional(field("block", $.block_argument)),
        ),
      ),

    qualified_call: ($) =>
      prec(
        PREC.ACCESS,
        seq(
          field("module", $.module_path),
          ".",
          field("name", choice($.identifier, $.module_name)),
          token.immediate("("),
          optional($.argument_list),
          ")",
        ),
      ),

    block_argument: ($) =>
      prec.dynamic(-1, seq("{", optional($.body), "}")),

    argument_list: ($) => commaSep1($._expression),

    field_access: ($) =>
      prec.left(
        PREC.ACCESS,
        seq(
          $._expression,
          ".",
          field("field", choice($.identifier, $.module_name)),
        ),
      ),

    module_access: ($) =>
      prec(PREC.ACCESS, seq($.module_path, ".", $.module_name)),

    function_reference: ($) =>
      prec(
        PREC.ACCESS + 1,
        seq(
          field("module", $.module_path),
          ".",
          field("name", $.identifier),
          "/",
          field("arity", $.integer),
        ),
      ),

    // ── Attribute and intrinsic expressions ───────────────────────
    attribute_reference: ($) => seq("@", field("name", $.identifier)),

    intrinsic_call: ($) =>
      prec(
        1,
        seq(
          "@",
          field("name", $.identifier),
          token.immediate("("),
          optional($.argument_list),
          ")",
        ),
      ),

    // ── Control flow ──────────────────────────────────────────────
    if_expression: ($) =>
      seq(
        "if",
        field("condition", $._expression),
        "{",
        field("then", optional($.body)),
        "}",
        optional(seq("else", "{", field("else", optional($.body)), "}")),
      ),

    case_expression: ($) =>
      seq(
        "case",
        field("subject", $._expression),
        "{",
        repeat1($.case_clause),
        "}",
      ),

    case_clause: ($) =>
      seq(
        field("pattern", $._expression),
        optional(seq("::", field("type_annotation", $.type_expression))),
        optional(seq("if", field("guard", $._expression))),
        "->",
        field("body", $._expression),
      ),

    cond_expression: ($) =>
      seq("cond", "{", repeat1($.cond_clause), "}"),

    cond_clause: ($) =>
      seq(
        field("condition", $._expression),
        "->",
        field("body", $._expression),
      ),

    // ── For comprehension ─────────────────────────────────────────
    for_expression: ($) =>
      seq(
        "for",
        field("variable", $.identifier),
        "<-",
        field("iterable", $._expression),
        optional(seq(",", field("filter", $._expression))),
        "{",
        field("body", $._expression),
        "}",
      ),

    with_expression: ($) =>
      seq(
        "with",
        commaSep1($.with_clause),
        "{",
        field("body", $.body),
        "}",
        optional(seq("else", "{", repeat1($.case_clause), "}")),
      ),

    with_clause: ($) => seq($._expression, "<-", $._expression),

    // ── Quote / Unquote ───────────────────────────────────────────
    quote_expression: ($) => seq("quote", "{", optional($.body), "}"),

    unquote_expression: ($) => seq("unquote", "(", $._expression, ")"),

    unquote_splicing_expression: ($) =>
      seq("unquote_splicing", "(", $._expression, ")"),

    // ── Panic ─────────────────────────────────────────────────────
    panic_expression: ($) => seq("panic", "(", $._expression, ")"),

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
